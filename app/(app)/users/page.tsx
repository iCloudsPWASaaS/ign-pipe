import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { UsersManager } from "@/components/users-manager";
import { getSession } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";

export default async function UsersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== 1) redirect("/dashboard");

  const { data, error } = await getAdminClient().from("staff_profile").select("*").order("name");
  return (
    <div>
      <PageHeader title="Users" description="Staff accounts, roles and portal access." icon={Users} />
      {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error.message}</div> : null}
      <UsersManager initialRows={data ?? []} />
    </div>
  );
}
