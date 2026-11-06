import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAppSettings } from "@/lib/app-settings";
import { initials } from "@/lib/format";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");
  const settings = await getAppSettings();
  const appName = settings.appName;
  const appSubtitle = settings.appSubtitle;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-white/60 bg-white shadow-card">
        <div className="grid md:grid-cols-[1.1fr_1fr]">
          <section className="relative hidden flex-col justify-between overflow-hidden bg-pipe-ink p-10 text-white md:flex">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-500/30 blur-2xl" />
            <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-amber-400/20 blur-2xl" />
            <div className="relative">
              <div className="mb-8 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500 text-xl font-black">
                  {initials(appName)}
                </div>
                <div>
                  <div className="text-lg font-bold leading-tight">{appName}</div>
                  <div className="text-xs text-white/60">{appSubtitle}</div>
                </div>
              </div>
              <h1 className="max-w-sm text-3xl font-black leading-tight">
                Issues, appointments, invoices and compliance in one place.
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-white/60">
                A like-for-like rebuild of the existing {appName} {appSubtitle}, now running on
                Next.js with the legacy data model preserved in Supabase schema
                <span className="font-mono text-white/80"> pipe</span>.
              </p>
            </div>
            <div className="relative grid grid-cols-3 gap-3 text-center text-[11px] text-white/50">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">Issues</div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">Schedules</div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">Invoices</div>
            </div>
          </section>

          <section className="p-8 sm:p-10">
            <div className="mb-8 md:hidden">
              <div className="text-xl font-black text-pipe-ink">{appName} {appSubtitle}</div>
            </div>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-pipe-ink">Log in</h2>
              <p className="mt-1 text-sm text-slate-500">
                Use the same staff credentials as the PHP CRM.
              </p>
            </div>
            <LoginForm />
            <p className="mt-6 text-center text-xs text-slate-400">
              Default legacy login: <span className="font-mono">wils / wils</span>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
