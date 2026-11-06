import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PropertyLedger } from "@/components/property-ledger";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  return (
    <div>
      <PageHeader
        title="Property Lookup"
        description="Search a property code to see its issues, appointments, invoices, purchases, float entries, quotes and timesheets."
        icon={Building2}
      />
      <PropertyLedger initialCode={params.code} />
    </div>
  );
}
