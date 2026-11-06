import { getAdminClient } from "./supabase/admin";

export async function nextInvoiceNumber(prefix = "PM"): Promise<string> {
  const db = getAdminClient();
  const [a, b] = await Promise.all([
    db.from("control_sheet_approved").select("invoice_no").like("invoice_no", `${prefix}%`).limit(5000),
    db.from("invoicefree").select("invoice_no").like("invoice_no", `${prefix}%`).limit(5000),
  ]);

  const numbers = [...(a.data ?? []), ...(b.data ?? [])]
    .map((row) => String(row.invoice_no || ""))
    .map((value) => {
      const match = value.match(/\d+/);
      return match ? Number(match[0]) : 0;
    })
    .filter((value) => Number.isFinite(value));

  const max = numbers.length ? Math.max(...numbers) : 999;
  return `${prefix}${max + 1}`;
}
