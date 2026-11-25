import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseGate } from "@/components/app-shell";
import { UnitHub } from "@/components/lesson/unit-hub";
import { UNITS, getUnit } from "@/lib/units";

export function generateStaticParams() {
  return UNITS.map((unit) => ({ unit: unit.id }));
}

export const metadata: Metadata = { title: "Unit" };

export default async function UnitPage({ params }: PageProps<"/lesson/[unit]">) {
  const unit = getUnit((await params).unit);
  if (!unit) notFound();
  return (
    <CourseGate>
      <UnitHub unitId={unit.id} />
    </CourseGate>
  );
}
