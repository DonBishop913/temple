import { render, screen, fireEvent } from "@testing-library/react";
import YeshuasClock from "../YeshuasClock";

test("toggle harmonic refinement", () => {
  render(<YeshuasClock />);
  const toggle = screen.getByRole("switch", { name: /harmonic refinement/i });
  // starts checked
  expect(toggle).toBeChecked();
  // click toggles off
  fireEvent.click(toggle);
  expect(toggle).not.toBeChecked();
});

test("harmonic sensitivity slider updates", () => {
  render(<YeshuasClock />);
  const slider = screen.getByRole("slider", { name: /harmonic sensitivity/i });
  fireEvent.change(slider, { target: { value: 0.7 } });
  expect(slider.value).toBe("0.7");
});
