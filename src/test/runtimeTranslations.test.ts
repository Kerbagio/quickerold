import { describe, expect, it } from "vitest";
import { translateAppText } from "@/i18n/translateAppText";

describe("translateAppText", () => {
  it("translates triage navigation and questions to Arabic", () => {
    expect(translateAppText("Triage", "ar")).toBe("الفرز الطبي");
    expect(
      translateAppText(
        "Is the person breathing normally and able to speak?",
        "ar",
      ),
    ).toBe("هل يتنفس الشخص بشكل طبيعي ويستطيع الكلام؟");
  });

  it("translates triage interface text to French", () => {
    expect(translateAppText("No download", "fr")).toBe(
      "Aucun téléchargement",
    );
    expect(translateAppText("Find suitable hospitals", "fr")).toBe(
      "Trouver des hôpitaux adaptés",
    );
  });

  it("translates dynamic search radii and candidate counts", () => {
    expect(translateAppText("12 km radius", "ar")).toBe("نطاق 12 كم");
    expect(translateAppText("8 km radius", "fr")).toBe("rayon de 8 km");
    expect(translateAppText("6 hospitals ranked", "fr")).toBe(
      "6 hôpitaux classés",
    );
  });

  it("translates hospital-search and routing failures", () => {
    expect(
      translateAppText(
        "No hospitals were found nearby. Expand the radius or contact local emergency services.",
        "ar",
      ),
    ).toContain("لم يتم العثور على مستشفيات");
    expect(
      translateAppText(
        "The public route service is unavailable. You can still open this hospital in your navigation app.",
        "fr",
      ),
    ).toContain("service public d’itinéraire");
  });

  it("translates dynamic specialty fallback messages", () => {
    expect(
      translateAppText(
        "No cardiac specialty was found in OpenStreetMap tags, so general hospitals are shown for confirmation.",
        "fr",
      ),
    ).toContain("Cardiologie");
  });

  it("keeps hospital names and unsupported text unchanged", () => {
    expect(translateAppText("Hotel Dieu de France", "ar")).toBe(
      "Hotel Dieu de France",
    );
    expect(translateAppText("Custom user message", "fr")).toBe(
      "Custom user message",
    );
  });

  it("returns original English when English is active", () => {
    expect(translateAppText("Current assessment", "en")).toBe(
      "Current assessment",
    );
  });
});
