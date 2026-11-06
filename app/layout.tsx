import type { Metadata } from "next";
import { getAppSettings } from "@/lib/app-settings";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { appName, appSubtitle } = await getAppSettings();
  return {
    title: `${appName} ${appSubtitle}`,
    description: `${appName} ${appSubtitle}`,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
