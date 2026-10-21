import type { Metadata } from "next";
import { Onboarding } from "@/components/screens/onboarding";

export const metadata: Metadata = { title: "Choose a language" };

export default function StartPage() {
  return <Onboarding />;
}
