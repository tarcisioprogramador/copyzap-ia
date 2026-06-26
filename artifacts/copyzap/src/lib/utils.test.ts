import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges class names correctly", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("merges Tailwind classes with conflicts resolved", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
  });

  it("handles undefined and null values", () => {
    expect(cn("px-4", undefined, null, "py-2")).toBe("px-4 py-2");
  });

  it("handles object syntax", () => {
    expect(cn({ "px-4": true, "hidden": false })).toBe("px-4");
  });
});
