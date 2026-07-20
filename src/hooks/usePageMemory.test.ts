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
    readPageMemory("agent.count", 1);

    expect(writePageMemory<number>("agent.count", (value) => value + 1)).toBe(
      2,
    );
    expect(readPageMemory("agent.count", 0)).toBe(2);
  });

  it("can clear one page namespace without clearing other pages", () => {
    readPageMemory("home.location", { lat: 1, lng: 2 });
    readPageMemory("agent.messages", ["hello"]);

    clearPageMemory("home.");

    expect(readPageMemory("home.location", null)).toBeNull();
    expect(readPageMemory("agent.messages", [])).toEqual(["hello"]);
  });
});
