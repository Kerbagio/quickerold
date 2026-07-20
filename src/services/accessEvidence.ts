export interface AccessEvidenceHospital {
  etaMinutes: number;
  tags: Record<string, string>;
}

export interface AccessEvidenceSummary {
  candidateCount: number;
  withinFiveMinutes: number;
  withinTenMinutes: number;
  withinFifteenMinutes: number;
  wheelchairTagged: number;
  emergencyTagged: number;
  alwaysOpenTagged: number;
  facilitiesWithAnyAccessTag: number;
  metadataCoveragePercent: number;
}

export function hasWheelchairEvidence(
  hospital: AccessEvidenceHospital,
): boolean {
  return (
    hospital.tags.wheelchair === "yes" ||
    hospital.tags.wheelchair === "limited"
  );
}

export function hasEmergencyEvidence(
  hospital: AccessEvidenceHospital,
): boolean {
  return hospital.tags.emergency === "yes";
}

export function hasAlwaysOpenEvidence(
  hospital: AccessEvidenceHospital,
): boolean {
  return hospital.tags.opening_hours?.split(" ").join("") === "24/7";
}

export function summarizeAccessEvidence<
  T extends AccessEvidenceHospital,
>(hospitals: T[]): AccessEvidenceSummary {
  const wheelchairTagged = hospitals.filter(hasWheelchairEvidence).length;
  const emergencyTagged = hospitals.filter(hasEmergencyEvidence).length;
  const alwaysOpenTagged = hospitals.filter(hasAlwaysOpenEvidence).length;
  const facilitiesWithAnyAccessTag = hospitals.filter(
    (hospital) =>
      hasWheelchairEvidence(hospital) ||
      hasEmergencyEvidence(hospital) ||
      hasAlwaysOpenEvidence(hospital),
  ).length;

  return {
    candidateCount: hospitals.length,
    withinFiveMinutes: hospitals.filter(
      (hospital) => hospital.etaMinutes <= 5,
    ).length,
    withinTenMinutes: hospitals.filter(
      (hospital) => hospital.etaMinutes <= 10,
    ).length,
    withinFifteenMinutes: hospitals.filter(
      (hospital) => hospital.etaMinutes <= 15,
    ).length,
    wheelchairTagged,
    emergencyTagged,
    alwaysOpenTagged,
    facilitiesWithAnyAccessTag,
    metadataCoveragePercent: hospitals.length
      ? Math.round((facilitiesWithAnyAccessTag / hospitals.length) * 100)
      : 0,
  };
}
