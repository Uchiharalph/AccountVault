import { create } from "zustand";
import {
  deleteAccountLocally,
  getAllLocalAccounts,
  getPendingDeletes,
  getUnsyncedAccounts,
  markAsSynced,
  markForDeletion,
  saveAccountLocally,
  updateAccountLocally,
} from "../lib/localdb";
import { supabase } from "../lib/supabase";
import { Account } from "../types";

let cachedUserId: string | null = null;
let isSyncing = false;

export const setCachedUserId = (id: string | null) => {
  cachedUserId = id;
};

const getUserId = async (): Promise<string | null> => {
  if (cachedUserId) return cachedUserId;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user?.id) {
      cachedUserId = session.user.id;
      return cachedUserId;
    }
  } catch (e) {
    // offline
  }
  return null;
};

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

    const userId = await getUserId();
    if (!userId) {
      set({ loading: false });
      return;
    }

    // Always load from local first filtered by user
    const localAccounts = getAllLocalAccounts(userId);
    set({ accounts: localAccounts as Account[], loading: false });

    // Sync pending deletes FIRST before pulling from Supabase
    await get().syncPending();

    // Now fetch from Supabase
    try {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        const pendingDeletes = getPendingDeletes(userId);
        const pendingDeleteIds = new Set(pendingDeletes.map((r: any) => r.id));

        const unsynced = getUnsyncedAccounts(userId);
        const unsyncedIds = new Set(unsynced.map((r: any) => r.id));

        data.forEach((account: any) => {
          if (
            !pendingDeleteIds.has(account.id) &&
            !unsyncedIds.has(account.id)
          ) {
            saveAccountLocally({ ...account, synced: 1 });
          }
        });

        const merged = getAllLocalAccounts(userId);
        set({ accounts: merged as Account[], loading: false });
      }
    } catch (e) {
      set({ loading: false });
    }
  },

  addAccount: async (account) => {
    const userId = await getUserId();
    if (!userId) return;

    const tempId = `local_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const newAccount = {
      id: tempId,
      user_id: userId,
      ...account,
      created_at: new Date().toISOString(),
      synced: 0,
      pending_delete: 0,
    };

    saveAccountLocally(newAccount);
    set((state) => ({
      accounts: [newAccount as Account, ...state.accounts],
    }));

    try {
      const { data, error } = await supabase
        .from("accounts")
        .insert({
          user_id: userId,
          name: newAccount.name,
          website_url: newAccount.website_url || null,
          email_used: newAccount.email_used,
          category: newAccount.category,
          login_method: newAccount.login_method,
          notes: newAccount.notes || null,
          is_active: newAccount.is_active,
          created_at: newAccount.created_at,
        })
        .select()
        .single();

      if (!error && data) {
        deleteAccountLocally(tempId);
        saveAccountLocally({ ...data, synced: 1 });
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === tempId ? (data as Account) : a,
          ),
        }));
      }
    } catch (e) {
      console.log("Saved locally, will sync when online");
    }
  },

  updateAccount: async (id, updates) => {
    updateAccountLocally(id, { ...updates, synced: 0 });
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === id ? { ...a, ...updates } : a,
      ),
    }));

    try {
      await supabase.from("accounts").update(updates).eq("id", id);
      markAsSynced(id);
    } catch (e) {
      console.log("Update saved locally, will sync when online");
    }
  },

  deleteAccount: async (id) => {
    if (id.startsWith("local_")) {
      deleteAccountLocally(id);
      set((state) => ({
        accounts: state.accounts.filter((a) => a.id !== id),
      }));
      return;
    }

    markForDeletion(id);
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
    }));

    try {
      const deletePromise = supabase.from("accounts").delete().eq("id", id);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 5000),
      );

      const { error } = (await Promise.race([
        deletePromise,
        timeoutPromise,
      ])) as any;

      if (!error) {
        deleteAccountLocally(id);
      }
    } catch (e) {
      console.log(`Offline — ${id} marked for deletion, will sync later`);
    }
  },

  syncPending: async () => {
    if (isSyncing) return;
    isSyncing = true;

    try {
      const userId = await getUserId();
      if (!userId) return;

      // 1. Sync pending deletes first
      const pendingDeletes = getPendingDeletes(userId);
      console.log(`Found ${pendingDeletes.length} pending deletes`);

      for (const account of pendingDeletes as any[]) {
        try {
          const { error } = await supabase
            .from("accounts")
            .delete()
            .eq("id", account.id);

          if (!error) {
            deleteAccountLocally(account.id);
            console.log(`Deleted ${account.name} from Supabase`);
          }
        } catch (e) {
          // Still offline
        }
      }

      // 2. Sync unsynced new accounts
      const unsynced = getUnsyncedAccounts(userId);
      for (const account of unsynced as any[]) {
        if (!account.id.startsWith("local_")) {
          markAsSynced(account.id);
          continue;
        }

        try {
          const { data, error } = await supabase
            .from("accounts")
            .insert({
              user_id: account.user_id,
              name: account.name,
              website_url: account.website_url || null,
              email_used: account.email_used,
              category: account.category,
              login_method: account.login_method,
              notes: account.notes || null,
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
          console.log(`Still offline, will sync later`);
        }
      }
    } finally {
      isSyncing = false;
    }
  },
}));
