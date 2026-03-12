"use client";

interface PropertySelectorProps {
  properties: string[];
  selectedProperty: string | null;
  onSelect: (property: string) => void;
}

export function PropertySelector({
  properties,
  selectedProperty,
  onSelect,
}: PropertySelectorProps) {
  if (properties.length <= 1) {
    return (
      <span className="text-sm font-medium text-text-primary">
        {properties[0] ?? "No properties assigned"}
      </span>
    );
  }

  return (
    <select
      value={selectedProperty ?? properties[0]}
      onChange={(e) => onSelect(e.target.value)}
      className="bg-transparent border border-card-border rounded-pill px-3 py-1 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald/30 cursor-pointer"
    >
      {properties.map((property) => (
        <option key={property} value={property}>
          {property}
        </option>
      ))}
    </select>
  );
}
