import React from "react";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import SpectralWaterfall from "../components/SpectralWaterfall";

expect.extend(toHaveNoViolations);

// jsdom polyfill for plotly.js
beforeAll(() => {
  if (!window.URL) window.URL = {};
  if (!window.URL.createObjectURL)
    window.URL.createObjectURL = () => "blob:url";
});

describe("SpectralWaterfall accessibility", () => {
  it("has no accessibility violations", async () => {
    const { container } = render(
      <SpectralWaterfall wsUrl="ws://localhost:4322" />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
