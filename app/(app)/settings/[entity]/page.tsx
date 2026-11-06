import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { SettingsManager } from "@/components/settings-manager";
import { getEntityDef } from "@/lib/settings-config";
import { getAdminClient } from "@/lib/supabase/admin";

export default async function SettingsEntityPage({
  params,
}: {
  params: Promise<{ entity: string }>;
}) {
  const { entity } = await params;
  const def = getEntityDef(entity);
  if (!def) notFound();

  const db = getAdminClient();
  const { data, error } = await db
    .from(def!.table)
    .select("*")
    .order(def!.pk, { ascending: true })
    .limit(500);

  return (
    <div>
      <PageHeader title={def!.title} description={def!.description} />
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          Could not load records: {error.message}. Have you run the pipe schema SQL?
        </div>
      ) : null}
      <SettingsManager entityKey={entity} def={def!} initialRows={data ?? []} />
    </div>
  );
}
