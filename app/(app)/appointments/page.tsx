import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { AppointmentBoard } from "@/components/appointment-board";
import { getAdminClient } from "@/lib/supabase/admin";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ job_no?: string; p_id?: string; reported_issue_no?: string; date?: string }>;
}) {
  const params = await searchParams;
  const date = params.date || new Date().toISOString().slice(0, 10);
  const db = getAdminClient();
  const [contractors, slots] = await Promise.all([
    db.from("contractor").select("c_id,contractor,color,active").eq("active", 1).order("contractor"),
    db.from("scheduler_view").select("*").eq("scheduler_date", date).order("sTime"),
  ]);

  return (
    <div>
      <PageHeader
        title="Appointment"
        description="Book and review contractor visits. The same AM / PM / all-day slots as the legacy scheduler."
        icon={CalendarDays}
      />
      <AppointmentBoard
        contractors={contractors.data ?? []}
        initialDate={date}
        initialSlots={slots.data ?? []}
        prefill={{
          job_no: params.job_no,
          p_id: params.p_id,
          reported_issue_no: params.reported_issue_no,
        }}
      />
    </div>
  );
}
