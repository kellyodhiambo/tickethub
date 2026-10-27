import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  verified: boolean;
  location: string | null;
  avatar_url: string | null;
};

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  profileError: string | null;
  isAdmin: boolean;
  isOrganizer: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const PROFILE_COLUMNS = "id, email, full_name, role, verified, location, avatar_url";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    // The callback stays synchronous: it only stores session state.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id ?? null;
  const userEmail = session?.user?.email ?? "";

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setProfileError(null);
      return;
    }

    setProfileLoading(true);
    setProfileError(null);
    try {
      const { data, error } = await supabase
        .from("users")
        .select(PROFILE_COLUMNS)
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data as Profile);
        return;
      }

      // First sign-in: create the profile row for this account.
      const meta = (session?.user?.user_metadata ?? {}) as Record<string, unknown>;
      const fullName = typeof meta.full_name === "string" ? meta.full_name : null;
      const role = typeof meta.role === "string" && meta.role ? meta.role : "member";

      const { error: upsertError } = await supabase
        .from("users")
        .upsert({ id: userId, email: userEmail, full_name: fullName, role }, {
          onConflict: "id",
          ignoreDuplicates: true,
        });
      if (upsertError) throw upsertError;

      const { data: created, error: readError } = await supabase
        .from("users")
        .select(PROFILE_COLUMNS)
        .eq("id", userId)
        .maybeSingle();
      if (readError) throw readError;
      setProfile((created as Profile) ?? null);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Could not load your profile.");
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, [userId, userEmail, session]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      profileLoading,
      profileError,
      isAdmin: profile?.role === "admin",
      isOrganizer: profile?.role === "organizer" || profile?.role === "creator",
      refreshProfile,
      signOut,
    }),
    [session, profile, loading, profileLoading, profileError, refreshProfile, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
