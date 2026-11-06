import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CreateIssueForm } from "@/components/create-issue-form";
import { getAdminClient } from "@/lib/supabase/admin";

export default async function NewIssuePage() {
  const db = getAdminClient();
  const { data } = await db
    .from("control_sheet")
    .select("job_no")
    .order("job_no", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextJob = Number(data?.job_no || 0) + 1;

  return (
    <div>
      <PageHeader
        title="Create Issue"
        description={`Next job number is #${nextJob}. Pick a property, then add one or more reported issues.`}
        icon={ClipboardList}
      />
      <CreateIssueForm />
    </div>
  );
}
