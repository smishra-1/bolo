import type { Metadata } from "next";
import { CourseGate } from "@/components/app-shell";
import { PlacementCheck } from "@/components/screens/placement-check";

export const metadata: Metadata = { title: "Quick check" };

export default function CheckPage() {
  return (
    <CourseGate>
      <PlacementCheck />
    </CourseGate>
  );
}
