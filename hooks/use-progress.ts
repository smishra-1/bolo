"use client";

import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/components/app-provider";
import { currentStreak, weekActivity, type StarsByUnit } from "@/lib/progress";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Progress = { stars: StarsByUnit; streak: number; week: boolean[]; loaded: boolean };

const EMPTY: Progress = { stars: {}, streak: 0, week: new Array(7).fill(false), loaded: false };

/** Stars per unit and the daily streak for the current course. */
export function useProgress() {
  const { status, target } = useApp();
  const [progress, setProgress] = useState<Progress>(EMPTY);

  const load = useCallback(async () => {
    if (status !== "ready" || !target) return;
    const supabase = getSupabaseBrowserClient();
    const since = new Date();
    since.setDate(since.getDate() - 60);

    // RLS limits both queries to the signed-in learner's rows.
    const [units, attempts] = await Promise.all([
      supabase.from("unit_progress").select("unit_id, stars").eq("target_lang", target),
      supabase
        .from("lesson_attempts")
        .select("created_at")
        .eq("target_lang", target)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    const stars: StarsByUnit = {};
    for (const row of units.data ?? []) stars[row.unit_id as keyof StarsByUnit] = row.stars;
    const days = (attempts.data ?? []).map((row) => new Date(row.created_at));
    setProgress({ stars, streak: currentStreak(days), week: weekActivity(days), loaded: true });
  }, [status, target]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads remote data once the course is known
    load().catch((error: unknown) => console.error("Could not load progress", error));
  }, [load]);

  return { ...progress, reload: load };
}
