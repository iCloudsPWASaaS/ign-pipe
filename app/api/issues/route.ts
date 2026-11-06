import { fail, ok, readJson, requireApiSession, searchParams } from "@/lib/api";
import { getAdminClient } from "@/lib/supabase/admin";

function dedupeByJob(rows: Record<string, unknown>[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = String(row.job_no ?? "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;

  const params = searchParams(request);
  const q = (params.get("q") || "").trim();
  const status = params.get("status") || "";
  const limit = Math.min(Number(params.get("limit") || 100), 500);

  const db = getAdminClient();
  let query = db.from("issue_full").select("*").order("job_no", { ascending: false }).limit(limit * 3);

  if (status === "open") {
    query = query.not("status", "in", '("Close","Closed")');
  } else if (status === "closed") {
    query = query.in("status", ["Close", "Closed"]);
  }

  if (q) {
    query = query.or(
      [
        `reported_issue.ilike.%${q}%`,
        `p_name.ilike.%${q}%`,
        `p_no.ilike.%${q}%`,
        `p_location.ilike.%${q}%`,
        `client_ref.ilike.%${q}%`,
        `tenant.ilike.%${q}%`,
      ].join(","),
    );
  }

  const { data, error } = await query;
  if (error) return fail(error.message, 500);
  return ok({ data: dedupeByJob(data ?? []).slice(0, limit) });
}

type IssueItem = {
  reported_issue?: string;
  r_id?: number | string | null;
  priority?: string;
  c_id?: number | string | null;
  issue_quoted?: number | string | null;
  client_ref?: string;
  reported_issue_option_value?: string;
  reported_issue_option_price?: number | string | null;
  landlord_approved?: string;
  n_code?: string;
  d_code?: string;
  invoice_note?: string;
};

type CreateIssueBody = {
  maintenance_date?: string;
  p_id?: string;
  issue_type?: number | string;
  gsc_boiler_service?: string | number;
  items?: IssueItem[];
};

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  if (auth.session.role > 2) return fail("Forbidden", 403);

  const body = await readJson<CreateIssueBody>(request);
  const items = Array.isArray(body.items) ? body.items.filter((item) => item.reported_issue?.trim()) : [];
  if (!body.p_id) return fail("Property is required", 400);
  if (!items.length) return fail("Add at least one reported issue", 400);

  const db = getAdminClient();
  const maintenanceDate = body.maintenance_date || new Date().toISOString().slice(0, 10);
  const issueType = Number(body.issue_type || 0);

  const { data: issue, error: issueError } = await db
    .from("control_sheet")
    .insert({
      maintenance_date: maintenanceDate,
      p_id: body.p_id,
      user_name: auth.session.user,
      issue_type: issueType,
      gsc_boiler_service: Number(body.gsc_boiler_service || 0),
    })
    .select("job_no")
    .single();

  if (issueError) return fail(issueError.message, 500);
  const jobNo = Number(issue.job_no);

  const updateText =
    issueType === 1
      ? ""
      : `${new Date().toLocaleDateString("en-GB")} - Email Acknowledgement - ${auth.session.user}`;

  const rows = items.map((item) => {
    const clientRef = String(item.client_ref || "").trim();
    const reported = String(item.reported_issue || "").trim();
    return {
      job_no: jobNo,
      reported_issue: clientRef ? `${clientRef} - ${reported}` : reported,
      r_id: item.r_id ? Number(item.r_id) : null,
      priority: item.priority || null,
      status: "Open",
      c_id: item.c_id ? Number(item.c_id) : null,
      update_issue: updateText,
      issue_quoted: Number(item.issue_quoted || 0),
      client_ref: clientRef,
      reported_issue_option_value: item.reported_issue_option_value || "",
      reported_issue_option_price: Number(item.reported_issue_option_price || 0),
      landlord_approved: item.landlord_approved || "",
      n_code: item.n_code || "",
      d_code: item.d_code || "",
      invoice_note: item.invoice_note || "",
      user_name: auth.session.user,
      updater: auth.session.user,
      update_date: maintenanceDate,
    };
  });

  const { error: detailError } = await db.from("control_sheet_approved").insert(rows);
  if (detailError) {
    await db.from("control_sheet").delete().eq("job_no", jobNo);
    return fail(detailError.message, 500);
  }

  return ok({ job_no: jobNo, items: rows.length }, { status: 201 });
}
