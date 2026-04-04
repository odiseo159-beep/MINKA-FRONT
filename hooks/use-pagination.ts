import { useState, useMemo, useEffect } from "react";

export function usePagination<T>(items: T[], initialRowsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  const totalPages = Math.max(1, Math.ceil(items.length / rowsPerPage));

  // Reset to page 1 when items change (e.g. filter change)
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  // Clamp page if it exceeds total
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return items.slice(start, start + rowsPerPage);
  }, [items, currentPage, rowsPerPage]);

  const startIndex = (currentPage - 1) * rowsPerPage + 1;
  const endIndex = Math.min(currentPage * rowsPerPage, items.length);

  return {
    paginatedItems,
    currentPage,
    totalPages,
    rowsPerPage,
    totalItems: items.length,
    startIndex,
    endIndex,
    goToPage: setCurrentPage,
    nextPage: () => setCurrentPage((p) => Math.min(p + 1, totalPages)),
    prevPage: () => setCurrentPage((p) => Math.max(p - 1, 1)),
    setRowsPerPage: (n: number) => {
      setRowsPerPage(n);
      setCurrentPage(1);
    },
  };
}
