const { yeshuaFilter } = require("../lib/yeshuaFilter");

describe("yeshuaFilter vigilance tests", () => {
  test("allows clear English alignment phrases", () => {
    const input =
      "This text proclaims Divine Alignment and Truth in YESHUA for all to follow.";
    const out = yeshuaFilter(input);
    expect(out).toBe(input);
  });

  test("allows Spanish alignment phrases", () => {
    const input =
      "Esta declaración confirma la alineacion divina y la verdad en Yeshua.";
    const out = yeshuaFilter(input);
    expect(out).toBe(input);
  });

  test("permits fuzzy matches (typo / partial) for principle", () => {
    const input = "We seek divne aligmnent and harmonic unty in the mission."; // intentional typos
    const out = yeshuaFilter(input);
    // Fuzzy match should allow this (not perfect but near enough)
    expect(out).toBe(input);
  });

  test("blocks content with negative signals", () => {
    const input = "This plan uses deception and trick to mislead people.";
    const out = yeshuaFilter(input);
    expect(out.startsWith("FILTERED")).toBe(true);
  });

  test("blocks empty or non-string responses", () => {
    expect(yeshuaFilter(null).startsWith("FILTERED")).toBe(true);
    expect(yeshuaFilter("").startsWith("FILTERED")).toBe(true);
  });
});
