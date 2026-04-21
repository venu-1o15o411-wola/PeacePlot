import { createURL } from "expo-linking";
import type { Session, User } from "@supabase/supabase-js";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { formatAuthError } from "@/lib/auth-errors";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isSupabaseConfigured: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (params: {
    email: string;
    password: string;
    userid: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
  isUseridAvailable: (userid: string) => Promise<boolean | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async (): Promise<Session | null> => {
    const client = supabase;
    if (!client) return null;
    const { data, error } = await client.auth.getSession();
    if (error) {
      throw new Error(formatAuthError(error));
    }
    return data.session ?? null;
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    refreshSession()
      .then((next) => {
        if (!cancelled) setSession(next ?? null);
      })
      .catch(() => {
        // Keep app usable even if auth bootstrap fails.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [refreshSession]);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const client = supabase;
    if (!client) {
      throw new Error(
        "Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
      );
    }
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw new Error(formatAuthError(error));
    const next = data.session ?? (await refreshSession());
    if (!next) {
      throw new Error("Signed in, but no session is available. Please try again.");
    }
    setSession(next);
  }, [refreshSession]);

  const isUseridAvailable = useCallback(async (userid: string): Promise<boolean | null> => {
    const client = supabase;
    if (!client) return null;
    const trimmed = userid.trim();
    if (trimmed.length < 2) return false;

    const { data, error } = await client.rpc("is_userid_available", {
      p_userid: trimmed,
    });

    if (error) {
      // Migration not applied or RPC missing — skip server check.
      if (
        error.code === "42883" ||
        error.message?.includes("does not exist") ||
        error.code === "PGRST202"
      ) {
        return null;
      }
      throw new Error(formatAuthError(error));
    }

    return data === true;
  }, []);

  const signUp = useCallback(
    async (params: {
      email: string;
      password: string;
      userid: string;
    }): Promise<void> => {
      const client = supabase;
      if (!client) {
        throw new Error(
          "Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
        );
      }

      const email = params.email.trim().toLowerCase();
      const userid = params.userid.trim();

      if (userid.length < 2) {
        throw new Error("Choose a user ID at least 2 characters long.");
      }
      if (params.password.length < 8) {
        throw new Error("Use a password with at least 8 characters.");
      }

      const available = await isUseridAvailable(userid);
      if (available === false) {
        throw new Error("This user ID is already taken. Try another.");
      }

      const { data, error } = await client.auth.signUp({
        email,
        password: params.password,
        options: {
          data: {
            userid,
          },
        },
      });

      if (error) throw new Error(formatAuthError(error));

      if (data.session) {
        setSession(data.session);
        return;
      }

      // If sign-up succeeded but returned no session, try explicit sign-in.
      const { data: signinData, error: signinErr } = await client.auth.signInWithPassword({
        email,
        password: params.password,
      });
      if (signinErr) {
        throw new Error(
          "Account created but no active session was issued. Confirm email may still be required in Supabase Auth settings.",
        );
      }
      const next = signinData.session ?? (await refreshSession());
      if (!next) {
        throw new Error("Account created, but session bootstrap failed. Please sign in again.");
      }
      setSession(next);
    },
    [isUseridAvailable, refreshSession],
  );

  const signOut = useCallback(async () => {
    const client = supabase;
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) throw new Error(formatAuthError(error));
  }, []);

  const resetPasswordForEmail = useCallback(async (email: string) => {
    const client = supabase;
    if (!client) {
      throw new Error(
        "Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
      );
    }
    const redirectTo = createURL("/");

    const { error } = await client.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo },
    );
    if (error) throw new Error(formatAuthError(error));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      isSupabaseConfigured,
      signInWithPassword,
      signUp,
      signOut,
      resetPasswordForEmail,
      isUseridAvailable,
    }),
    [
      session,
      loading,
      signInWithPassword,
      signUp,
      signOut,
      resetPasswordForEmail,
      isUseridAvailable,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
