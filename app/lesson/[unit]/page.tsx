import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseGate } from "@/components/app-shell";
import { LessonPlayer } from "@/components/lesson/lesson-player";
import { UNITS, getUnit } from "@/lib/units";

export function generateStaticParams() {
  return UNITS.map((unit) => ({ unit: unit.id }));
}

export const metadata: Metadata = { title: "Lesson" };

export default async function LessonPage({ params }: PageProps<"/lesson/[unit]">) {
  const unit = getUnit((await params).unit);
  if (!unit) notFound();
  return (
    <CourseGate>
      <LessonPlayer unitId={unit.id} />
    </CourseGate>
  );
}
