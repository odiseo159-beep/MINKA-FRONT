import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePagination } from "@/hooks/use-pagination";

const items = Array.from({ length: 25 }, (_, i) => i + 1);

describe("usePagination", () => {
  it("returns first page of items", () => {
    const { result } = renderHook(() => usePagination(items, 10));
    expect(result.current.paginatedItems).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.totalItems).toBe(25);
  });

  it("navigates to next page", () => {
    const { result } = renderHook(() => usePagination(items, 10));
    act(() => result.current.nextPage());
    expect(result.current.currentPage).toBe(2);
    expect(result.current.paginatedItems).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  });

  it("navigates to specific page", () => {
    const { result } = renderHook(() => usePagination(items, 10));
    act(() => result.current.goToPage(3));
    expect(result.current.currentPage).toBe(3);
    expect(result.current.paginatedItems).toEqual([21, 22, 23, 24, 25]);
  });

  it("does not go past last page", () => {
    const { result } = renderHook(() => usePagination(items, 10));
    act(() => result.current.goToPage(3));
    act(() => result.current.nextPage());
    expect(result.current.currentPage).toBe(3);
  });

  it("does not go before first page", () => {
    const { result } = renderHook(() => usePagination(items, 10));
    act(() => result.current.prevPage());
    expect(result.current.currentPage).toBe(1);
  });

  it("changes rows per page and resets to page 1", () => {
    const { result } = renderHook(() => usePagination(items, 10));
    act(() => result.current.goToPage(2));
    act(() => result.current.setRowsPerPage(25));
    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.paginatedItems.length).toBe(25);
  });

  it("shows correct startIndex and endIndex", () => {
    const { result } = renderHook(() => usePagination(items, 10));
    expect(result.current.startIndex).toBe(1);
    expect(result.current.endIndex).toBe(10);

    act(() => result.current.goToPage(3));
    expect(result.current.startIndex).toBe(21);
    expect(result.current.endIndex).toBe(25);
  });

  it("handles empty array", () => {
    const { result } = renderHook(() => usePagination([], 10));
    expect(result.current.paginatedItems).toEqual([]);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.currentPage).toBe(1);
  });
});
