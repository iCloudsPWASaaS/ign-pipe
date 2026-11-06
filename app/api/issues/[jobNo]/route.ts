import { fail, ok, readJson, requireApiSession } from "@/lib/api";
import { getAdminClient } from "@/lib/supabase/admin";

function pick(body: Record<string, unknown>, keys: string[]) {
  const payload: Record<string, unknown> = {};
  for (const key of keys) {
    if (key in body) {
      const value = body[key];
      payload[key] = value === "" ? null : value;
    }
  }
  return payload;
}

const issueColumns = ["maintenance_date", "p_id", "issue_type", "gsc_boiler_service", "company"];

const detailColumns = [
  "reported_issue",
  "r_id",
  "landlord_approved",
  "priority",
  "update_issue",
  "status",
  "status_contractor",
  "scheduler_id",
  "c_id",
  "c_id_2",
  "update_no",
  "user_name",
  "updater",
  "update_date",
  "closing_date",
  "issue_invoiced",
  "issue_invoiced_date",
  "issue_quoted",
  "client_ref",
  "reported_issue_option_value",
  "reported_issue_option_price",
  "noaccess",
  "subcontractor_status",
  "subcontractor_date_booked",
  "subcontractor_time",
  "subcontractor_key_status",
  "subcontractor_note",
  "subcontractor_jobcompletion_date",
  "subcontractor_jobcompletion_note",
  "follow_up_status",
  "heater_left_status",
  "n_code",
  "d_code",
  "invoice_note",
  "invoice_status",
  "invoice_no",
];

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobNo: string }> },
) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;

  const { jobNo } = await context.params;
  const db = getAdminClient();

  const { data: issue, error: issueError } = await db
    .from("control_sheet")
    .select("*")
    .eq("job_no", Number(jobNo))
    .maybeSingle();
  if (issueError) return fail(issueError.message, 500);
  if (!issue) return fail("Issue not found", 404);

  const [details, property, parts, schedules] = await Promise.all([
    db.from("control_sheet_approved").select("*").eq("job_no", Number(jobNo)).order("sl_no"),
    db.from("property").select("*").eq("p_id", issue.p_id).maybeSingle(),
    db.from("part_details").select("*").eq("job_no", Number(jobNo)).order("part_id"),
    db.from("schedule").select("*").eq("job_no", Number(jobNo)).order("scheduler_date"),
  ]);

  let reporter = null;
  if (property.data?.r_id) {
    const result = await db.from("reporter").select("*").eq("r_id", property.data.r_id).maybeSingle();
    reporter = result.data;
  }

  return ok({
    issue,
    details: details.data ?? [],
    property: property.data ?? null,
    reporter,
    parts: parts.data ?? [],
    schedules: schedules.data ?? [],
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ jobNo: string }> },
) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  if (auth.session.role > 2) return fail("Forbidden", 403);

  const { jobNo } = await context.params;
  const body = await readJson<Record<string, unknown>>(request);
  const db = getAdminClient();
  const job = Number(jobNo);

  const issuePayload = pick(body, issueColumns);
  if (Object.keys(issuePayload).length) {
    const { error } = await db.from("control_sheet").update(issuePayload).eq("job_no", job);
    if (error) return fail(error.message, 500);
  }

  if (Array.isArray(body.details)) {
    for (const raw of body.details as Record<string, unknown>[]) {
      const detailPayload = pick(raw, detailColumns);
      detailPayload.updater = auth.session.user;
      if (raw.sl_no) {
        const { error } = await db
          .from("control_sheet_approved")
          .update(detailPayload)
          .eq("sl_no", Number(raw.sl_no));
        if (error) return fail(error.message, 500);
      } else {
        const { error } = await db.from("control_sheet_approved").insert({
          ...detailPayload,
          job_no: job,
          user_name: auth.session.user,
          status: detailPayload.status || "Open",
        });
        if (error) return fail(error.message, 500);
      }
    }
  }

  if (Array.isArray(body.delete_detail_ids)) {
    const ids = (body.delete_detail_ids as unknown[]).map(Number).filter(Boolean);
    if (ids.length) {
      const { error } = await db.from("control_sheet_approved").delete().in("sl_no", ids);
      if (error) return fail(error.message, 500);
    }
  }

  return ok({ ok: true });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ jobNo: string }> },
) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  if (auth.session.role !== 1) return fail("Forbidden", 403);

  const { jobNo } = await context.params;
  const db = getAdminClient();
  const job = Number(jobNo);

  await db.from("control_sheet_approved").delete().eq("job_no", job);
  await db.from("schedule").delete().eq("job_no", job);
  await db.from("part_details").delete().eq("job_no", job);
  const { error } = await db.from("control_sheet").delete().eq("job_no", job);
  if (error) return fail(error.message, 500);
  return ok({ ok: true });
}
