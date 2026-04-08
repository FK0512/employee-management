import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type SessionState = {
  session: Session | null;
  bootstrapped: boolean;
  activeOrganizationId: string | null;
  bootstrap: () => Promise<void>;
  setSession: (session: Session | null) => void;
  refreshActiveOrg: () => Promise<void>;
  setActiveOrg: (orgId: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  bootstrapped: false,
  activeOrganizationId: null,

  setSession: (session) => set({ session }),

  bootstrap: async () => {
    const { data } = await supabase.auth.getSession();
    set({ session: data.session ?? null });
    await get().refreshActiveOrg();
    set({ bootstrapped: true });
  },

  refreshActiveOrg: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      set({ activeOrganizationId: null });
      return;
    }
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("active_organization_id")
      .eq("id", data.user.id)
      .maybeSingle();
    if (error) {
      // eslint-disable-next-line no-console
      console.warn(error);
      set({ activeOrganizationId: null });
      return;
    }
    set({ activeOrganizationId: profile?.active_organization_id ?? null });
  },

  setActiveOrg: async (orgId) => {
    await supabase.rpc("set_active_organization", { p_org_id: orgId });
    set({ activeOrganizationId: orgId });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, activeOrganizationId: null });
  }
}));

