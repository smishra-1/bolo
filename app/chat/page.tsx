import type { Metadata } from "next";
import { CourseGate } from "@/components/app-shell";
import { ChatBuddy } from "@/components/screens/chat-buddy";

export const metadata: Metadata = { title: "Chat buddy" };

export default function ChatPage() {
  return (
    <CourseGate>
      <ChatBuddy />
    </CourseGate>
  );
}
