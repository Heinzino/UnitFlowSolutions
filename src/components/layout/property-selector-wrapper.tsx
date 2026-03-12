"use client";

import { useState } from "react";
import { PropertySelector } from "./property-selector";

interface PropertySelectorWrapperProps {
  properties: string[];
}

export function PropertySelectorWrapper({
  properties,
}: PropertySelectorWrapperProps) {
  const [selectedProperty, setSelectedProperty] = useState<string>(
    properties[0] ?? ""
  );

  return (
    <PropertySelector
      properties={properties}
      selectedProperty={selectedProperty}
      onSelect={setSelectedProperty}
    />
  );
}
