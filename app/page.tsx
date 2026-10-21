import type { Metadata } from "next";
import { Landing } from "@/components/landing";

export const metadata: Metadata = {
  title: { absolute: "Bolo — learn a language by speaking" },
  description:
    "Bite-sized lessons, instant pronunciation feedback and an AI chat buddy. Learn Spanish, French, German, Japanese or Hindi with Bolo, free.",
};

export default function Home() {
  return <Landing />;
}
