import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui";
import { ROLE_LABELS } from "@/lib/types/auth";
import type { UserRole } from "@/lib/types/auth";
import { PropertySelectorWrapper } from "./property-selector-wrapper";

export async function UserHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const role = (user.app_metadata?.role as UserRole) ?? "pm";
  const propertyIds: string[] = user.app_metadata?.property_ids ?? [];
  const name: string =
    user.user_metadata?.full_name ?? user.email ?? "Unknown";

  const roleLabel = ROLE_LABELS[role] ?? role;

  let propertyContext: React.ReactNode;

  if (role === "exec" || role === "dm") {
    propertyContext = (
      <span className="text-sm text-white/70">All Properties</span>
    );
  } else if (propertyIds.length === 0) {
    propertyContext = (
      <span className="text-sm text-white/70">No properties assigned</span>
    );
  } else if (propertyIds.length === 1) {
    propertyContext = (
      <span className="text-sm text-white/70">{propertyIds[0]}</span>
    );
  } else {
    propertyContext = <PropertySelectorWrapper properties={propertyIds} />;
  }

  return (
    <div className="flex items-center gap-3">
      {propertyContext}
      <span className="text-sm font-medium text-white">{name}</span>
      <Badge variant="emerald">{roleLabel}</Badge>
    </div>
  );
}
