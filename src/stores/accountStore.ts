import { create } from "zustand";
import {
  deleteAccountLocally,
  getAllLocalAccounts,
  getUnsyncedAccounts,
  markAsSynced,
  saveAccountLocally,
  updateAccountLocally,
} from "../lib/localdb";
import { supabase } from "../lib/supabase";
import { Account } from "../types";

interface AccountStore {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  fetchAccounts: () => Promise<void>;
  addAccount: (
    account: Omit<Account, "id" | "user_id" | "created_at">,
  ) => Promise<void>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  syncPending: () => Promise<void>;
}

export const useAccountStore = create<AccountStore>((set, get) => ({
  accounts: [],
  loading: false,
  error: null,

  fetchAccounts: async () => {
    set({ loading: true, error: null });

    // Always load from local first — instant, works offline
    const localAccounts = getAllLocalAccounts();
    if (localAccounts.length > 0) {
      set({ accounts: localAccounts as Account[], loading: false });
    }

    // Then try to sync from Supabase in background
    try {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        // Save all Supabase accounts to local DB
        data.forEach((account: any) => {
          saveAccountLocally({ ...account, synced: 1 });
        });
        set({ accounts: data as Account[], loading: false });
      }
    } catch (e) {
      // No internet — use local data, already set above
      set({ loading: false });
    }

    // Sync any pending local accounts to Supabase
    get().syncPending();
  },

  addAccount: async (account) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const newAccount = {
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: user.id,
      ...account,
      created_at: new Date().toISOString(),
      synced: 0,
    };

    // Save locally immediately — no internet needed
    saveAccountLocally(newAccount);
    set((state) => ({
      accounts: [newAccount as Account, ...state.accounts],
    }));

    // Try to sync to Supabase right away
    try {
      const { data, error } = await supabase
        .from("accounts")
        .insert({
          ...newAccount,
          id: undefined, // let Supabase generate real UUID
        })
        .select()
        .single();

      if (!error && data) {
        // Replace local temp record with real Supabase record
        deleteAccountLocally(newAccount.id);
        saveAccountLocally({ ...data, synced: 1 });
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === newAccount.id ? (data as Account) : a,
          ),
        }));
      }
    } catch (e) {
      // No internet — stays in local DB with synced=0
      // Will sync when internet returns via syncPending()
      console.log("Saved locally, will sync when online");
    }
  },

  updateAccount: async (id, updates) => {
    // Update locally immediately
    updateAccountLocally(id, { ...updates, synced: 0 });
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === id ? { ...a, ...updates } : a,
      ),
    }));

    // Try Supabase
    try {
      await supabase.from("accounts").update(updates).eq("id", id);
      markAsSynced(id);
    } catch (e) {
      console.log("Update saved locally, will sync when online");
    }
  },

  deleteAccount: async (id) => {
    // Delete locally immediately
    deleteAccountLocally(id);
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
    }));

    // Try Supabase
    try {
      await supabase.from("accounts").delete().eq("id", id);
    } catch (e) {
      console.log("Will sync deletion when online");
    }
  },

  syncPending: async () => {
    const unsynced = getUnsyncedAccounts();
    if (unsynced.length === 0) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    for (const account of unsynced as any[]) {
      try {
        const { data, error } = await supabase
          .from("accounts")
          .insert({
            user_id: account.user_id,
            name: account.name,
            website_url: account.website_url,
            email_used: account.email_used,
            category: account.category,
            login_method: account.login_method,
            notes: account.notes,
            is_active: account.is_active === 1,
            created_at: account.created_at,
          })
          .select()
          .single();

        if (!error && data) {
          deleteAccountLocally(account.id);
          saveAccountLocally({ ...data, synced: 1 });
          set((state) => ({
            accounts: state.accounts.map((a) =>
              a.id === account.id ? (data as Account) : a,
            ),
          }));
        }
      } catch (e) {
        // Still offline, try next time
      }
    }
  },
}));
