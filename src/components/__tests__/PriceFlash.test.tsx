import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { PriceFlash } from "@/components/PriceFlash";

afterEach(() => {
  vi.useRealTimers();
});

describe("PriceFlash", () => {
  it("renders children", () => {
    render(<PriceFlash value={100}>$100.00</PriceFlash>);
    expect(screen.getByText("$100.00")).toBeInTheDocument();
  });

  it("has no flash class on initial render", () => {
    render(<PriceFlash value={100}>$100.00</PriceFlash>);
    const span = screen.getByText("$100.00");
    expect(span.className).not.toContain("price-flash-up");
    expect(span.className).not.toContain("price-flash-down");
  });

  it("applies price-flash-up when value increases", () => {
    vi.useFakeTimers();

    const { rerender } = render(<PriceFlash value={100}>$100.00</PriceFlash>);
    rerender(<PriceFlash value={110}>$110.00</PriceFlash>);

    expect(screen.getByText("$110.00").className).toContain("price-flash-up");
  });

  it("applies price-flash-down when value decreases", () => {
    vi.useFakeTimers();

    const { rerender } = render(<PriceFlash value={100}>$100.00</PriceFlash>);
    rerender(<PriceFlash value={90}>$90.00</PriceFlash>);

    expect(screen.getByText("$90.00").className).toContain("price-flash-down");
  });

  it("clears the flash class after 700ms", () => {
    vi.useFakeTimers();

    const { rerender } = render(<PriceFlash value={100}>$100.00</PriceFlash>);
    rerender(<PriceFlash value={110}>$110.00</PriceFlash>);

    expect(screen.getByText("$110.00").className).toContain("price-flash-up");

    act(() => { vi.advanceTimersByTime(701); });

    expect(screen.getByText("$110.00").className).not.toContain("price-flash-up");
  });

  it("does not flash when value is unchanged", () => {
    const { rerender } = render(<PriceFlash value={100}>$100.00</PriceFlash>);
    rerender(<PriceFlash value={100}>$100.00</PriceFlash>);

    const span = screen.getByText("$100.00");
    expect(span.className).not.toContain("price-flash-up");
    expect(span.className).not.toContain("price-flash-down");
  });

  it("preserves custom className alongside flash class", () => {
    vi.useFakeTimers();

    const { rerender } = render(<PriceFlash value={100} className="font-bold">$100.00</PriceFlash>);
    rerender(<PriceFlash value={110} className="font-bold">$110.00</PriceFlash>);

    const span = screen.getByText("$110.00");
    expect(span.className).toContain("font-bold");
    expect(span.className).toContain("price-flash-up");
  });
});
