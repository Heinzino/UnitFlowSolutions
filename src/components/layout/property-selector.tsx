"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { clsx } from "clsx";

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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = selectedProperty ?? properties[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (properties.length <= 1) {
    return (
      <span className="text-sm font-medium text-white/80">
        {properties[0] ?? "No properties assigned"}
      </span>
    );
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-sm font-medium text-white hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-emerald/30 transition-colors cursor-pointer"
      >
        {current}
        <ChevronDown
          size={14}
          className={clsx(
            "text-white/60 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 min-w-[200px] bg-forest-light border border-white/15 rounded-xl shadow-lg py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {properties.map((property) => {
            const isActive = property === current;
            return (
              <button
                key={property}
                type="button"
                onClick={() => {
                  onSelect(property);
                  setOpen(false);
                }}
                className={clsx(
                  "flex items-center justify-between w-full px-3 py-2 text-sm text-left transition-colors",
                  isActive
                    ? "text-emerald bg-white/10 font-medium"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                {property}
                {isActive && <Check size={14} className="text-emerald" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
