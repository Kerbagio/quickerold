import { describe, expect, it } from "vitest";
import { translateUiText } from "@/i18n/translateUiText";

describe("translateUiText", () => {
  it("translates triage navigation and questions to Arabic", () => {
    expect(translateUiText("Triage", "ar")).toBe("الفرز الطبي");
    expect(
      translateUiText(
        "Is the person breathing normally and able to speak?",
        "ar",
      ),
    ).toBe("هل يتنفس الشخص بشكل طبيعي ويستطيع الكلام؟");
  });

  it("translates triage interface text to French", () => {
    expect(translateUiText("No download", "fr")).toBe(
      "Aucun téléchargement",
    );
    expect(translateUiText("Find suitable hospitals", "fr")).toBe(
      "Trouver des hôpitaux adaptés",
    );
  });

  it("translates dynamic search radii and candidate counts", () => {
    expect(translateUiText("12 km radius", "ar")).toBe("نطاق 12 كم");
    expect(translateUiText("8 km radius", "fr")).toBe("rayon de 8 km");
    expect(translateUiText("6 hospitals ranked", "fr")).toBe(
      "6 hôpitaux classés",
    );
  });

  it("translates hospital-search and routing failures", () => {
    expect(
      translateUiText(
        "No hospitals were found nearby. Expand the radius or contact local emergency services.",
        "ar",
      ),
    ).toContain("لم يتم العثور على مستشفيات");
    expect(
      translateUiText(
        "The public route service is unavailable. You can still open this hospital in your navigation app.",
        "fr",
      ),
    ).toContain("service public d’itinéraire");
  });

  it("translates lowercase dynamic specialty fallback messages", () => {
    expect(
      translateUiText(
        "No cardiac specialty was found in OpenStreetMap tags, so general hospitals are shown for confirmation.",
        "fr",
      ),
    ).toContain("cardiologie");
  });

  it("keeps hospital names and unsupported text unchanged", () => {
    expect(translateUiText("Hotel Dieu de France", "ar")).toBe(
      "Hotel Dieu de France",
    );
    expect(translateUiText("Custom user message", "fr")).toBe(
      "Custom user message",
    );
  });

  it("returns original English when English is active", () => {
    expect(translateUiText("Current assessment", "en")).toBe(
      "Current assessment",
    );
  });
});
