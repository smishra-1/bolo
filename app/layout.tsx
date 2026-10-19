import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import { AppProvider } from "@/components/app-provider";
import "./globals.css";

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin", "devanagari"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Bolo — learn a language by speaking", template: "%s · Bolo" },
  description:
    "Bolo is a free, AI-powered language buddy: bite-sized lessons, speaking practice with instant feedback, and a built-in translator.",
  applicationName: "Bolo",
};

export const viewport: Viewport = {
  themeColor: "#fffaf0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${baloo.variable} ${nunito.variable} h-full`}>
      <body className="min-h-full">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
