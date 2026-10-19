import type { Metadata } from "next";
import { CourseGate } from "@/components/app-shell";
import { Translator } from "@/components/screens/translator";

export const metadata: Metadata = { title: "Translator" };

export default function TranslatePage() {
  return (
    <CourseGate>
      <Translator />
    </CourseGate>
  );
}
