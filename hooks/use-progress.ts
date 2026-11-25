"use client";

import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/components/app-provider";
import { currentStreak, weekActivity, type ProgressByUnit } from "@/lib/progress";
import { isPart, type UnitId } from "@/lib/units";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Progress = { stars: ProgressByUnit; streak: number; week: boolean[]; loaded: boolean };

const EMPTY: Progress = { stars: {}, streak: 0, week: new Array(7).fill(false), loaded: false };

/** Stars per part of each unit and the daily streak for the current course. */
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
      supabase.from("unit_progress").select("unit_id, part, stars").eq("target_lang", target),
      supabase
        .from("lesson_attempts")
        .select("created_at")
        .eq("target_lang", target)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    const stars: ProgressByUnit = {};
    for (const row of units.data ?? []) {
      if (!isPart(row.part)) continue;
      const id = row.unit_id as UnitId;
      stars[id] = { ...stars[id], [row.part]: row.stars };
    }
    const days = (attempts.data ?? []).map((row) => new Date(row.created_at));
    setProgress({ stars, streak: currentStreak(days), week: weekActivity(days), loaded: true });
  }, [status, target]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads remote data once the course is known
    load().catch((error: unknown) => console.error("Could not load progress", error));
  }, [load]);

  return { ...progress, reload: load };
}
