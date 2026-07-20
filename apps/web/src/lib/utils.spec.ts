import { truncateForDisplay } from "./utils";

describe("truncateForDisplay", () => {
  it("returns the text unchanged when it's within the limit", () => {
    expect(truncateForDisplay("short reply", 2000)).toBe("short reply");
  });

  it("truncates and appends an ellipsis when the text exceeds the limit", () => {
    const long = "a".repeat(50);
    const result = truncateForDisplay(long, 10);

    expect(result).toBe(`${"a".repeat(10)}…`);
    expect(result.length).toBe(11);
  });

  it("uses a sensible default limit when none is given", () => {
    const long = "b".repeat(3000);
    const result = truncateForDisplay(long);

    expect(result.length).toBeLessThan(long.length);
    expect(result.endsWith("…")).toBe(true);
  });
});
