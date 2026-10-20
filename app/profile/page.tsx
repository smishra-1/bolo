import type { Metadata } from "next";
import { CourseGate } from "@/components/app-shell";
import { Profile } from "@/components/screens/profile";

export const metadata: Metadata = { title: "My profile" };

export default function ProfilePage() {
  return (
    <CourseGate>
      <Profile />
    </CourseGate>
  );
}
