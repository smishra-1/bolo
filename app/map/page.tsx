import type { Metadata } from "next";
import { CourseGate } from "@/components/app-shell";
import { LearningMap } from "@/components/screens/learning-map";

export const metadata: Metadata = { title: "Learning map" };

export default function MapPage() {
  return (
    <CourseGate>
      <LearningMap />
    </CourseGate>
  );
}
