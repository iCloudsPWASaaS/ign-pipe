"use client";

import { useRouter } from "next/navigation";
import { PropertyPicker } from "@/components/property-picker";
import type { PropertyOption } from "@/components/property-picker";

export function PropertyQuickSearch() {
  const router = useRouter();

  function go(property: PropertyOption | null) {
    if (!property) return;
    const code = property.p_code || property.p_no || property.p_id;
    router.push(`/properties?code=${encodeURIComponent(String(code))}`);
  }

  return (
    <div className="hidden w-[220px] md:block xl:w-[280px]">
      <PropertyPicker placeholder="Property code..." onSelect={go} />
    </div>
  );
}
