# Digital Memory for Businesses

Production-ready SaaS starter for “company memory”: decisions, meetings, and the “why” behind actions, built with React + Supabase.

## 1) Create Supabase project

1. Create a new Supabase project.
2. In Supabase SQL Editor, run `supabase/schema.sql`.
3. In Supabase Auth settings, enable Email auth (and optionally disable email confirmations for local dev).

## 2) Configure env

1. Copy `.env.example` to `.env`.
2. Fill:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## 3) Run locally

```bash
npm install
npm run dev
```

## 4) Deploy (Vercel)

1. Import the repo into Vercel.
2. Add the same env vars in Vercel Project Settings.
3. Deploy.

## App flow

- Signup/Login
- Create or join an organization (join code)
- Dashboard shows recent decisions + meetings
- Create decisions with “why” + tags
- Create meetings + notes
- Search across memory items

