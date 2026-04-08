-- Digital Memory for Businesses (Supabase/Postgres)
-- Multi-tenant: organizations + memberships, with RLS enforcing tenant isolation.

create extension if not exists pgcrypto;

-- Helpers
create or replace function public.is_authenticated()
returns boolean
language sql
stable
as $$
  select auth.uid() is not null
$$;

create or replace function public.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = p_org_id
      and m.user_id = auth.uid()
  )
$$;

create or replace function public.is_org_admin(p_org_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = p_org_id
      and m.user_id = auth.uid()
      and m.role = 'admin'
  )
$$;

-- Core tables
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  join_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  active_organization_id uuid references public.organizations(id) on delete set null,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_type where typname = 'membership_role') then
    create type public.membership_role as enum ('admin', 'member');
  end if;
end $$;

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.membership_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 200),
  description text,
  why text,
  decided_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  search_tsv tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(why,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description,'')), 'C')
  ) stored
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 200),
  occurred_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.meeting_notes (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 50000),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  search_tsv tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(content,'')), 'B')
  ) stored
);

-- Legacy schema migration: older versions stored organization_id redundantly on child/join tables.
-- Drop these columns so inserts don't require passing organization_id and we avoid drift.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'meeting_notes'
      and column_name = 'organization_id'
  ) then
    alter table public.meeting_notes drop column organization_id;
  end if;
exception
  when undefined_column then null;
end $$;

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 48),
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists public.decision_tags (
  decision_id uuid not null references public.decisions(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (decision_id, tag_id)
);

create table if not exists public.meeting_tags (
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (meeting_id, tag_id)
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'decision_tags'
      and column_name = 'organization_id'
  ) then
    alter table public.decision_tags drop column organization_id;
  end if;
exception
  when undefined_column then null;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'meeting_tags'
      and column_name = 'organization_id'
  ) then
    alter table public.meeting_tags drop column organization_id;
  end if;
exception
  when undefined_column then null;
end $$;

-- Trigger: create profile row on new auth user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Org creation/join RPCs (avoid opening organizations table for public reads)
create or replace function public.create_organization(org_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_join_code text;
begin
  perform set_config('row_security', 'off', true);
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Avoid gen_random_bytes() (not always available). UUID-based code is still plenty unique for invites.
  v_join_code := substring(replace(gen_random_uuid()::text, '-', '') from 1 for 10);

  insert into public.organizations (name, join_code)
  values (org_name, v_join_code)
  returning id into v_org_id;

  insert into public.memberships (organization_id, user_id, role)
  values (v_org_id, auth.uid(), 'admin')
  on conflict (organization_id, user_id) do update set role = excluded.role;

  update public.profiles
  set active_organization_id = v_org_id
  where id = auth.uid();

  return v_org_id;
end;
$$;

create or replace function public.lookup_organization_by_join_code(p_join_code text)
returns table (organization_id uuid, organization_name text)
language sql
security definer
set search_path = public
stable
as $$
  select o.id, o.name
  from public.organizations o
  cross join (select set_config('row_security', 'off', true)) as _
  where o.join_code = p_join_code
  limit 1
$$;

create or replace function public.join_organization_by_code(p_join_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  perform set_config('row_security', 'off', true);
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select o.id into v_org_id
  from public.organizations o
  where o.join_code = p_join_code
  limit 1;

  if v_org_id is null then
    raise exception 'Invalid join code';
  end if;

  insert into public.memberships (organization_id, user_id, role)
  values (v_org_id, auth.uid(), 'member')
  on conflict (organization_id, user_id) do nothing;

  update public.profiles
  set active_organization_id = v_org_id
  where id = auth.uid();

  return v_org_id;
end;
$$;

create or replace function public.set_active_organization(p_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('row_security', 'off', true);
  update public.profiles
  set active_organization_id = p_org_id
  where id = auth.uid()
    and exists (
      select 1 from public.memberships m
      where m.organization_id = p_org_id
        and m.user_id = auth.uid()
    );
end;
$$;

-- Search RPC: unified results across decisions + meeting notes + meetings
create or replace function public.search_memory(p_org_id uuid, p_query text)
returns table (
  item_type text,
  item_id uuid,
  title text,
  snippet text,
  occurred_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  with q as (
    select websearch_to_tsquery('simple', coalesce(p_query, '')) as tsq
  )
  select
    'decision'::text as item_type,
    d.id as item_id,
    d.title,
    left(coalesce(d.why, d.description, ''), 220) as snippet,
    d.decided_at as occurred_at
  from public.decisions d, q
  where d.organization_id = p_org_id
    and d.search_tsv @@ q.tsq

  union all

  select
    'meeting'::text as item_type,
    m.id as item_id,
    m.title,
    'Meeting'::text as snippet,
    m.occurred_at as occurred_at
  from public.meetings m, q
  where m.organization_id = p_org_id
    and to_tsvector('simple', coalesce(m.title,'')) @@ q.tsq

  union all

  select
    'note'::text as item_type,
    n.id as item_id,
    (select m2.title from public.meetings m2 where m2.id = n.meeting_id) as title,
    left(n.content, 220) as snippet,
    n.created_at as occurred_at
  from public.meeting_notes n
  join public.meetings m3 on m3.id = n.meeting_id
  cross join q
  where m3.organization_id = p_org_id
    and n.search_tsv @@ q.tsq
  order by occurred_at desc
  limit 50
$$;

-- Indexes for scale
create index if not exists memberships_org_user_idx on public.memberships (organization_id, user_id);
create index if not exists decisions_org_decided_idx on public.decisions (organization_id, decided_at desc);
create index if not exists meetings_org_occurred_idx on public.meetings (organization_id, occurred_at desc);
create index if not exists decision_tags_tag_idx on public.decision_tags (tag_id);
create index if not exists meeting_tags_tag_idx on public.meeting_tags (tag_id);
create index if not exists tags_org_name_idx on public.tags (organization_id, name);
create index if not exists decisions_search_gin on public.decisions using gin (search_tsv);
create index if not exists meeting_notes_search_gin on public.meeting_notes using gin (search_tsv);

-- RLS
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.decisions enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_notes enable row level security;
alter table public.tags enable row level security;
alter table public.decision_tags enable row level security;
alter table public.meeting_tags enable row level security;

-- organizations: only members can read; only admins can update/delete
drop policy if exists org_select on public.organizations;
create policy org_select on public.organizations
  for select using (public.is_org_member(id));

drop policy if exists org_update on public.organizations;
create policy org_update on public.organizations
  for update using (public.is_org_admin(id));

drop policy if exists org_delete on public.organizations;
create policy org_delete on public.organizations
  for delete using (public.is_org_admin(id));

-- profiles: user can read/update own row
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (auth.uid() = id);

-- memberships: members can view org memberships; only admins can manage
drop policy if exists memberships_select on public.memberships;
create policy memberships_select on public.memberships
  for select using (auth.uid() = user_id);

drop policy if exists memberships_insert on public.memberships;
create policy memberships_insert on public.memberships
  for insert with check (false);

drop policy if exists memberships_update on public.memberships;
create policy memberships_update on public.memberships
  for update using (false);

drop policy if exists memberships_delete on public.memberships;
create policy memberships_delete on public.memberships
  for delete using (false);

-- Allow authenticated users to call safe RPCs
grant execute on function public.create_organization(text) to authenticated;
grant execute on function public.lookup_organization_by_join_code(text) to authenticated;
grant execute on function public.join_organization_by_code(text) to authenticated;
grant execute on function public.set_active_organization(uuid) to authenticated;
grant execute on function public.search_memory(uuid, text) to authenticated;

-- decisions: org members can read/create; creator or admin can edit/delete
drop policy if exists decisions_select on public.decisions;
create policy decisions_select on public.decisions
  for select using (public.is_org_member(organization_id));

drop policy if exists decisions_insert on public.decisions;
create policy decisions_insert on public.decisions
  for insert with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
  );

drop policy if exists decisions_update on public.decisions;
create policy decisions_update on public.decisions
  for update using (
    public.is_org_admin(organization_id)
    or created_by = auth.uid()
  );

drop policy if exists decisions_delete on public.decisions;
create policy decisions_delete on public.decisions
  for delete using (
    public.is_org_admin(organization_id)
    or created_by = auth.uid()
  );

-- meetings: org members can read/create; creator or admin can edit/delete
drop policy if exists meetings_select on public.meetings;
create policy meetings_select on public.meetings
  for select using (public.is_org_member(organization_id));

drop policy if exists meetings_insert on public.meetings;
create policy meetings_insert on public.meetings
  for insert with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
  );

drop policy if exists meetings_update on public.meetings;
create policy meetings_update on public.meetings
  for update using (
    public.is_org_admin(organization_id)
    or created_by = auth.uid()
  );

drop policy if exists meetings_delete on public.meetings;
create policy meetings_delete on public.meetings
  for delete using (
    public.is_org_admin(organization_id)
    or created_by = auth.uid()
  );

-- meeting notes
drop policy if exists meeting_notes_select on public.meeting_notes;
create policy meeting_notes_select on public.meeting_notes
  for select using (
    public.is_org_member((select m.organization_id from public.meetings m where m.id = meeting_id))
  );

drop policy if exists meeting_notes_insert on public.meeting_notes;
create policy meeting_notes_insert on public.meeting_notes
  for insert with check (
    public.is_org_member((select m.organization_id from public.meetings m where m.id = meeting_id))
    and created_by = auth.uid()
  );

drop policy if exists meeting_notes_update on public.meeting_notes;
create policy meeting_notes_update on public.meeting_notes
  for update using (
    public.is_org_admin((select m.organization_id from public.meetings m where m.id = meeting_id))
    or created_by = auth.uid()
  );

drop policy if exists meeting_notes_delete on public.meeting_notes;
create policy meeting_notes_delete on public.meeting_notes
  for delete using (
    public.is_org_admin((select m.organization_id from public.meetings m where m.id = meeting_id))
    or created_by = auth.uid()
  );

-- tags and tag joins
drop policy if exists tags_select on public.tags;
create policy tags_select on public.tags
  for select using (public.is_org_member(organization_id));

drop policy if exists tags_insert on public.tags;
create policy tags_insert on public.tags
  for insert with check (public.is_org_member(organization_id));

drop policy if exists tags_delete on public.tags;
create policy tags_delete on public.tags
  for delete using (public.is_org_admin(organization_id));

drop policy if exists decision_tags_all on public.decision_tags;
create policy decision_tags_all on public.decision_tags
  for all using (
    public.is_org_member((select d.organization_id from public.decisions d where d.id = decision_id))
  )
  with check (
    exists (
      select 1
      from public.decisions d
      join public.tags t on t.id = tag_id
      where d.id = decision_id
        and t.organization_id = d.organization_id
        and public.is_org_member(d.organization_id)
    )
  );

drop policy if exists meeting_tags_all on public.meeting_tags;
create policy meeting_tags_all on public.meeting_tags
  for all using (
    public.is_org_member((select m.organization_id from public.meetings m where m.id = meeting_id))
  )
  with check (
    exists (
      select 1
      from public.meetings m
      join public.tags t on t.id = tag_id
      where m.id = meeting_id
        and t.organization_id = m.organization_id
        and public.is_org_member(m.organization_id)
    )
  );
