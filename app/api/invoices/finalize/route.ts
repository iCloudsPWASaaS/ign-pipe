import { fail, ok, readJson, requireApiSession } from "@/lib/api";
import { nextInvoiceNumber } from "@/lib/invoice";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  if (auth.session.role > 2) return fail("Forbidden", 403);

  const body = await readJson<{ detail_ids?: unknown[] }>(request);
  const ids = (body.detail_ids ?? []).map(Number).filter(Boolean);
  if (!ids.length) return fail("Select at least one job to invoice", 400);

  const db = getAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const results: { detail_id: number; invoice_no: string }[] = [];

  for (const id of ids) {
    const invoiceNo = await nextInvoiceNumber("PM");
    const { error } = await db
      .from("control_sheet_approved")
      .update({
        invoice_no: invoiceNo,
        invoice_status: 1,
        invoice_created_date: today,
        issue_invoiced: 3,
      })
      .eq("sl_no", id);
    if (error) return fail(error.message, 500);
    results.push({ detail_id: id, invoice_no: invoiceNo });
  }

  return ok({ results });
}
