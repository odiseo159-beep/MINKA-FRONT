import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "@/hooks/use-debounce";

describe("useDebounce", () => {
  it("returns initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello", 300));
    expect(result.current).toBe("hello");
  });

  it("debounces value changes", async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "hello" } }
    );

    // Change value
    rerender({ value: "world" });
    expect(result.current).toBe("hello"); // Not yet changed

    // Advance time
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe("world"); // Now changed

    vi.useRealTimers();
  });

  it("resets timer on rapid changes", async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "a" } }
    );

    rerender({ value: "ab" });
    act(() => vi.advanceTimersByTime(100));
    rerender({ value: "abc" });
    act(() => vi.advanceTimersByTime(100));
    rerender({ value: "abcd" });

    // Not enough time has passed since last change
    expect(result.current).toBe("a");

    // Advance past the delay
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe("abcd");

    vi.useRealTimers();
  });
});
