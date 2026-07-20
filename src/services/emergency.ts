export const EMERGENCY_TYPES = [
  "general",
  "cardiac",
  "pediatric",
  "maternity",
] as const;

export type EmergencyType = (typeof EMERGENCY_TYPES)[number];

export function isEmergencyType(value: unknown): value is EmergencyType {
  return (
    typeof value === "string" &&
    EMERGENCY_TYPES.includes(value as EmergencyType)
  );
}

export function normalizeEmergencyType(
  value: string | null | undefined,
): EmergencyType {
  return isEmergencyType(value) ? value : "general";
}

export function emergencyTypeLabel(value: EmergencyType): string {
  return value === "general"
    ? "General ER"
    : `${value[0].toUpperCase()}${value.slice(1)}`;
}
