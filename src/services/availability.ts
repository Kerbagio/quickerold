export type AvailabilityStatus =
  | "accepting"
  | "limited"
  | "diverting"
  | "unknown";

export interface AvailabilityRecord {
  status: AvailabilityStatus;
  updatedAt: string | null;
  source: "demo" | "unknown";
}

const STORAGE_KEY = "quicker.demoAvailability.v1";

function readRecords(): Record<string, AvailabilityRecord> {
  if (typeof window === "undefined") return {};

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Record<string, AvailabilityRecord>) : {};
  } catch {
    return {};
  }
}

export function getAvailability(hospitalId: string): AvailabilityRecord {
  return (
    readRecords()[hospitalId] ?? {
      status: "unknown",
      updatedAt: null,
      source: "unknown",
    }
  );
}

export function setDemoAvailability(
  hospitalId: string,
  status: AvailabilityStatus,
): AvailabilityRecord {
  const records = readRecords();
  const record: AvailabilityRecord = {
    status,
    updatedAt: new Date().toISOString(),
    source: "demo",
  };
  records[hospitalId] = record;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  return record;
}

export function clearDemoAvailability(): void {
  localStorage.removeItem(STORAGE_KEY);
}

const availabilityTier: Record<AvailabilityStatus, number> = {
  accepting: 0,
  limited: 1,
  unknown: 2,
  diverting: 3,
};

export function sortForDispatch<
  T extends { etaMinutes: number; availability: AvailabilityRecord },
>(hospitals: T[]): T[] {
  return [...hospitals].sort((first, second) => {
    const tierDifference =
      availabilityTier[first.availability.status] -
      availabilityTier[second.availability.status];
    return tierDifference || first.etaMinutes - second.etaMinutes;
  });
}

export function availabilityLabel(status: AvailabilityStatus): string {
  switch (status) {
    case "accepting":
      return "Accepting (demo)";
    case "limited":
      return "Limited (demo)";
    case "diverting":
      return "Diverting (demo)";
    default:
      return "Availability unknown";
  }
}
