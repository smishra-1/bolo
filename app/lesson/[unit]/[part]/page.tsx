import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseGate } from "@/components/app-shell";
import { LessonPlayer } from "@/components/lesson/lesson-player";
import { PARTS, UNITS, getUnit, isPart } from "@/lib/units";

export function generateStaticParams() {
  return UNITS.flatMap((unit) => PARTS.map((part) => ({ unit: unit.id, part })));
}

export const metadata: Metadata = { title: "Lesson" };

export default async function LessonPage({ params }: PageProps<"/lesson/[unit]/[part]">) {
  const { unit: unitId, part } = await params;
  const unit = getUnit(unitId);
  if (!unit || !isPart(part)) notFound();
  return (
    <CourseGate>
      <LessonPlayer unitId={unit.id} part={part} />
    </CourseGate>
  );
}
