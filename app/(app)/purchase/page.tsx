import { ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { LedgerManager } from "@/components/ledger-manager";
import { getLookupData } from "@/lib/lookups";
import { getAdminClient } from "@/lib/supabase/admin";

export default async function PurchasePage() {
  const [lookups, rows] = await Promise.all([
    getLookupData(),
    getAdminClient().from("purchase").select("*").order("sl_no", { ascending: false }).limit(500),
  ]);
  const suppliers = new Map(lookups.suppliers.map((row: Record<string, unknown>) => [String(row.s_code), String(row.supplier ?? "")]));
  const enriched = (rows.data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    supplier: suppliers.get(String(row.s_code)) ?? "",
  }));

  return (
    <div>
      <PageHeader
        title="Purchase"
        description="Purchase invoices, supplier references and allocation to properties."
        icon={ShoppingCart}
      />
      <LedgerManager
        endpoint="/api/purchases"
        pk="sl_no"
        initialRows={enriched}
        lookups={lookups}
        columns={[
          { key: "inv_no", label: "Invoice no" },
          { key: "inv_date", label: "Invoice date", format: "date" },
          { key: "supplier", label: "Supplier" },
          { key: "description", label: "Description" },
          { key: "cost", label: "Cost", format: "money" },
          { key: "vat", label: "VAT", format: "money" },
          { key: "total", label: "Total", format: "money" },
          { key: "status", label: "Status" },
        ]}
        fields={[
          { name: "inv_no", label: "Invoice no" },
          { name: "ref_no", label: "Reference no" },
          { name: "inv_date", label: "Invoice date", type: "date" },
          { name: "rec_date", label: "Received date", type: "date" },
          { name: "s_code", label: "Supplier", type: "select", lookup: "suppliers" },
          { name: "n_code", label: "Nominal", type: "select", lookup: "accounts" },
          { name: "description", label: "Description", type: "textarea", span: 2 },
          { name: "cost", label: "Cost", type: "number" },
          { name: "vat", label: "VAT", type: "number" },
          { name: "total", label: "Total", type: "number" },
          { name: "vat_code", label: "VAT code" },
          { name: "total_type", label: "Total type", type: "select", options: [{ value: "net", label: "Net" }, { value: "gross", label: "Gross" }] },
          { name: "in_amount", label: "Amount in", type: "number" },
          { name: "p_id", label: "Property", type: "select", lookup: "properties" },
          { name: "d_code", label: "Department", type: "select", lookup: "departments" },
          { name: "product_sku", label: "Product SKU" },
          { name: "product_qty", label: "Product qty", type: "number" },
          { name: "status", label: "Status", type: "select", options: [{ value: "Open", label: "Open" }, { value: "Paid", label: "Paid" }, { value: "Reconciled", label: "Reconciled" }] },
        ]}
      />
    </div>
  );
}


