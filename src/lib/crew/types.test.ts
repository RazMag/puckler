import { describe, expect, it } from "vitest";
import { crewFileSchema, shorthandSchema } from "./types";

describe("shorthand", () => {
  it("trims and capitalizes, and treats blank as no shorthand", () => {
    expect(shorthandSchema.parse(" dor ")).toBe("DOR");
    expect(shorthandSchema.parse("")).toBeUndefined();
  });

  it("allows up to three letters or numbers in any script", () => {
    expect(shorthandSchema.parse("רז")).toBe("רז");
    expect(shorthandSchema.safeParse("DORO").success).toBe(false);
    expect(shorthandSchema.safeParse("D.").success).toBe(false);
  });

  it("reads crew files saved before shorthands existed", () => {
    const file = crewFileSchema.parse({ version: 1, members: [{ id: "a", name: "Doron", team: "MIN" }] });
    expect(file.members[0]?.short).toBeUndefined();
  });
});
