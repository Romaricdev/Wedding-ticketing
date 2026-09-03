import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("fusionne les classes Tailwind sans conflit", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("ignore les valeurs falsy", () => {
    expect(cn("text-text", false && "hidden", undefined, "font-medium")).toBe(
      "text-text font-medium",
    );
  });
});
