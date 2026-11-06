import { fail, ok, readJson, requireApiSession, searchParams } from "@/lib/api";
import { getAdminClient } from "@/lib/supabase/admin";

function slotTimes(slot: string) {
  if (slot === "am") return { sTime: "08:30:00", eTime: "13:00:00" };
  if (slot === "pm") return { sTime: "12:00:00", eTime: "17:30:00" };
  return { sTime: "08:30:00", eTime: "17:30:00" };
}

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;

  const params = searchParams(request);
  const date = params.get("date");
  const from = params.get("from");
  const to = params.get("to");
  const contractor = params.get("contractor");
  const status = params.get("status");

  const db = getAdminClient();
  let query = db.from("scheduler_view").select("*").order("scheduler_date", { ascending: true }).order("sTime");
  if (date) query = query.eq("scheduler_date", date);
  if (from) query = query.gte("scheduler_date", from);
  if (to) query = query.lte("scheduler_date", to);
  if (contractor) query = query.eq("c_id", Number(contractor));
  if (status) query = query.eq("status_contractor", status);

  const { data, error } = await query.limit(1000);
  if (error) return fail(error.message, 500);
  return ok({ data: data ?? [] });
}

type ScheduleBody = {
  id?: number;
  job_no?: number | string;
  eventDetail?: string;
  scheduler_date?: string;
  scheduler_time?: string;
  sTime?: string;
  eTime?: string;
  eventArea?: number | string;
  p_id?: string;
  c_id?: number | string;
  c_id2?: number | string;
  contact_type?: number | string;
  duration?: number | string;
  note?: string;
  reported_issue_no?: string;
  access_keys?: number | string;
  e_id?: number | string;
  status_contractor?: string;
};

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  if (auth.session.role > 2) return fail("Forbidden", 403);

  const body = await readJson<ScheduleBody>(request);
  if (!body.job_no || !body.scheduler_date) return fail("Job and date are required", 400);
  const times = slotTimes(body.scheduler_time || "ad");

  const payload = {
    job_no: Number(body.job_no),
    eventDetail: body.eventDetail || "Appointment",
    scheduler_date: body.scheduler_date,
    sTime: body.sTime || times.sTime,
    eTime: body.eTime || times.eTime,
    eventArea: Number(body.eventArea || 1),
    p_id: body.p_id || null,
    c_id: body.c_id ? Number(body.c_id) : null,
    c_id2: Number(body.c_id2 || 0),
    contact_type: body.contact_type ? Number(body.contact_type) : null,
    duration: Number(body.duration || 30),
    note: body.note || "",
    reported_issue_no: body.reported_issue_no || "",
    access_keys: Number(body.access_keys || 0),
    e_id: Number(body.e_id || 0),
    status_contractor: body.status_contractor || "N",
  };

  const db = getAdminClient();

  if (body.id) {
    const { error } = await db.from("schedule").update(payload).eq("id", Number(body.id));
    if (error) return fail(error.message, 500);
    return ok({ id: Number(body.id) });
  }

  const { data, error } = await db.from("schedule").insert(payload).select("id").single();
  if (error) return fail(error.message, 500);

  if (body.c_id && body.reported_issue_no) {
    const ids = String(body.reported_issue_no)
      .split(",")
      .map((value) => Number(value.trim()))
      .filter(Boolean);
    if (ids.length) {
      const { data: contractor } = await db
        .from("contractor")
        .select("contractor")
        .eq("c_id", Number(body.c_id))
        .maybeSingle();
      await db
        .from("control_sheet_approved")
        .update({
          c_id: Number(body.c_id),
          scheduler_id: Number(data.id),
          updater: auth.session.user,
        })
        .in("sl_no", ids);

      const appointment = `${new Date().toLocaleDateString("en-GB")} - Appointment confirmed ${body.scheduler_date} ${payload.sTime}-${payload.eTime} - ${contractor?.contractor || ""} - ${auth.session.user}`;
      const { data: existing } = await db
        .from("control_sheet_approved")
        .select("sl_no,update_issue")
        .in("sl_no", ids);
      for (const row of existing ?? []) {
        await db
          .from("control_sheet_approved")
          .update({
            update_issue: `${row.update_issue || ""}\n${appointment}`.trim(),
            update_date: body.scheduler_date,
          })
          .eq("sl_no", row.sl_no);
      }
    }
  }

  return ok({ id: Number(data.id) }, { status: 201 });
}
