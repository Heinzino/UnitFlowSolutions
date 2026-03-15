"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PropertySelector } from "./property-selector";

interface PropertySelectorWrapperProps {
  properties: string[];
}

export function PropertySelectorWrapper({
  properties,
}: PropertySelectorWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedProperty = searchParams.get("property") ?? properties[0] ?? "";

  function handleSelect(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "" || value === properties[0]) {
      params.delete("property");
    } else {
      params.set("property", value);
    }
    router.push(`/property${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <PropertySelector
      properties={properties}
      selectedProperty={selectedProperty}
      onSelect={handleSelect}
    />
  );
}
