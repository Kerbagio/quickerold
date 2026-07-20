import { beforeEach, describe, expect, it } from "vitest";
import {
  clearPageMemory,
  readPageMemory,
  writePageMemory,
} from "@/hooks/usePageMemory";

describe("page memory", () => {
  beforeEach(() => clearPageMemory());

  it("returns the existing page value instead of recreating it", () => {
    readPageMemory("home.results", ["Hospital A"]);

    expect(readPageMemory("home.results", [])).toEqual(["Hospital A"]);
  });

  it("supports functional state updates", () => {
    readPageMemory("scenario.count", 1);

    expect(writePageMemory<number>("scenario.count", (value) => value + 1)).toBe(
      2,
    );
    expect(readPageMemory("scenario.count", 0)).toBe(2);
  });

  it("can clear one page namespace without clearing other pages", () => {
    readPageMemory("home.location", { lat: 1, lng: 2 });
    readPageMemory("scenario.filters", ["general"]);

    clearPageMemory("home.");

    expect(readPageMemory("home.location", null)).toBeNull();
    expect(readPageMemory("scenario.filters", [])).toEqual(["general"]);
  });
});
