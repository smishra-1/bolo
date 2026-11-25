import type { Metadata } from "next";
import { CourseGate } from "@/components/app-shell";
import { Practice } from "@/components/screens/practice";

export const metadata: Metadata = { title: "Practice" };

export default function PracticePage() {
  return (
    <CourseGate>
      <Practice />
    </CourseGate>
  );
}
