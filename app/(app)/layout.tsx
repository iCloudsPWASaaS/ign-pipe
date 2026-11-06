import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAppSettings } from "@/lib/app-settings";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const settings = await getAppSettings();
  return (
    <AppShell
      session={session}
      appName={settings.appName}
      appSubtitle={settings.appSubtitle}
    >
      {children}
    </AppShell>
  );
}
