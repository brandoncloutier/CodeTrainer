import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ensureProfile = async (user: User) => {
  const now = new Date().toISOString();
  const createdAt = user.created_at ?? now;
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email,
      created_at: createdAt,
      last_sign_in_at: now
    },
    { onConflict: "id" }
  );
  if (error) {
    console.error("Failed to upsert profile:", error.message);
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) {
          return;
        }
        if (error) {
          console.error("Failed to load session:", error.message);
        }
        setSession(data.session ?? null);
        setLoading(false);
        if (data.session?.user) {
          void ensureProfile(data.session.user);
        }
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }
        console.error("Failed to load session:", error);
        setLoading(false);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, sessionData) => {
        setSession(sessionData);
        if (sessionData?.user) {
          void ensureProfile(sessionData.user);
        }
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Failed to sign out:", error.message);
    }
  }, []);

  const value = useMemo(
    () => ({
      session,
      loading,
      signOut
    }),
    [session, loading, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
