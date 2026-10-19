"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { getMessages, uiLocaleFor, type Messages } from "@/lib/i18n";
import { isNativeLang, isTargetLang, type NativeLang, type TargetLang } from "@/lib/languages";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Status = "loading" | "ready" | "signedOut" | "unconfigured" | "error";

type Course = { level: number; points: number };

type AppState = {
  status: Status;
  native: NativeLang;
  target: TargetLang | null;
  course: Course | null;
  m: Messages;
  setNative: (lang: NativeLang) => Promise<void>;
  setTarget: (lang: TargetLang) => Promise<void>;
  setLevel: (level: number) => Promise<void>;
  refreshCourse: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AppContext = createContext<AppState | null>(null);

const NATIVE_KEY = "bolo.native";

function initialNative(): NativeLang {
  try {
    const saved = localStorage.getItem(NATIVE_KEY);
    if (isNativeLang(saved)) return saved;
  } catch {
    // Storage can be blocked; fall through to the browser language.
  }
  const browser = navigator.language?.slice(0, 2);
  return isNativeLang(browser) ? browser : "en";
}

function rememberNative(lang: NativeLang) {
  try {
    localStorage.setItem(NATIVE_KEY, lang);
  } catch {
    // Not critical: the profile row is the source of truth.
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>(isSupabaseConfigured ? "loading" : "unconfigured");
  const [userId, setUserId] = useState<string | null>(null);
  const [native, setNativeState] = useState<NativeLang>("en");
  const [target, setTargetState] = useState<TargetLang | null>(null);
  const [course, setCourse] = useState<Course | null>(null);

  const loadCourse = useCallback(async (uid: string, lang: TargetLang) => {
    const { data } = await getSupabaseBrowserClient()
      .from("courses")
      .select("level, points")
      .eq("user_id", uid)
      .eq("target_lang", lang)
      .maybeSingle();
    setCourse(data ?? { level: 1, points: 0 });
  }, []);

  useEffect(() => {
    const guess = initialNative();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after mount
    setNativeState(guess);
    if (!isSupabaseConfigured) return;

    const supabase = getSupabaseBrowserClient();
    let cancelled = false;
    let loadedFor: string | null = null;

    const load = async (user: User | null) => {
      if (user?.is_anonymous) {
        // Left over from when anonymous sign-ins were allowed: require a real account.
        await supabase.auth.signOut();
        user = null;
      }
      if (!user) {
        loadedFor = null;
        setUserId(null);
        setTargetState(null);
        setCourse(null);
        setStatus("signedOut");
        return;
      }
      if (loadedFor === user.id) return;
      loadedFor = user.id;
      setStatus("loading");

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("native_lang, target_lang")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;

      if (!profile) {
        const { error: insertError } = await supabase.from("profiles").insert({ id: user.id, native_lang: guess });
        if (insertError) throw insertError;
      }
      if (cancelled) return;

      setUserId(user.id);
      const savedNative = isNativeLang(profile?.native_lang) ? profile.native_lang : guess;
      setNativeState(savedNative);
      rememberNative(savedNative);
      if (isTargetLang(profile?.target_lang)) {
        setTargetState(profile.target_lang);
        await loadCourse(user.id, profile.target_lang);
      } else {
        setTargetState(null);
        setCourse(null);
      }
      if (!cancelled) setStatus("ready");
    };

    const fail = (error: unknown) => {
      console.error("Bolo start-up failed", error);
      if (!cancelled) setStatus("error");
    };

    // getUser() checks the session with the Supabase server instead of trusting local storage.
    supabase.auth.getUser().then(({ data }) => load(data.user)).catch(fail);

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT") return;
      // Supabase warns against awaiting its own calls inside this callback.
      setTimeout(() => load(session?.user ?? null).catch(fail), 0);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [loadCourse]);

  useEffect(() => {
    document.documentElement.lang = uiLocaleFor(native);
  }, [native]);

  const setNative = useCallback(
    async (lang: NativeLang) => {
      setNativeState(lang);
      rememberNative(lang);
      if (!userId) return;
      // A learner cannot study the language they already speak.
      const clearTarget = target === lang;
      const { error } = await getSupabaseBrowserClient()
        .from("profiles")
        .update({ native_lang: lang, ...(clearTarget ? { target_lang: null } : {}), updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (error) throw error;
      if (clearTarget) {
        setTargetState(null);
        setCourse(null);
      }
    },
    [userId, target],
  );

  const setTarget = useCallback(
    async (lang: TargetLang) => {
      if (!userId) throw new Error("Not signed in");
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("profiles")
        .update({ target_lang: lang, updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (error) throw error;
      const { error: courseError } = await supabase
        .from("courses")
        .upsert({ user_id: userId, target_lang: lang, level: 1 }, { onConflict: "user_id,target_lang", ignoreDuplicates: true });
      if (courseError) throw courseError;
      setTargetState(lang);
      await loadCourse(userId, lang);
    },
    [userId, loadCourse],
  );

  const setLevel = useCallback(
    async (level: number) => {
      if (!userId || !target) throw new Error("No course selected");
      const { error } = await getSupabaseBrowserClient()
        .from("courses")
        .update({ level })
        .eq("user_id", userId)
        .eq("target_lang", target);
      if (error) throw error;
      setCourse((c) => ({ points: c?.points ?? 0, level }));
    },
    [userId, target],
  );

  const refreshCourse = useCallback(async () => {
    if (userId && target) await loadCourse(userId, target);
  }, [userId, target, loadCourse]);

  const signOut = useCallback(async () => {
    const { error } = await getSupabaseBrowserClient().auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo<AppState>(
    () => ({ status, native, target, course, m: getMessages(native), setNative, setTarget, setLevel, refreshCourse, signOut }),
    [status, native, target, course, setNative, setTarget, setLevel, refreshCourse, signOut],
  );

  return <AppContext value={value}>{children}</AppContext>;
}

export function useApp(): AppState {
  const state = use(AppContext);
  if (!state) throw new Error("useApp must be used inside <AppProvider>");
  return state;
}
