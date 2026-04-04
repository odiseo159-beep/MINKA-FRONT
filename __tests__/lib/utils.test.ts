import { describe, it, expect } from "vitest";
import {
  cn,
  formatDate,
  formatRelativeTime,
  getDateUrgencyClass,
  normalizePhone,
  getInitials,
  escapeHtml,
} from "@/lib/utils";

describe("cn", () => {
  it("merges tailwind classes", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("resolves conflicts (last wins)", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });
});

describe("formatDate", () => {
  it("formats ISO date string", () => {
    const result = formatDate("2026-04-15");
    expect(result).toContain("15");
    expect(result).toContain("2026");
  });

  it("formats ISO datetime with T separator", () => {
    const result = formatDate("2026-03-22T22:44:06.132614");
    expect(result).toContain("22");
    expect(result).toContain("2026");
  });

  it("formats datetime with space separator (backend format)", () => {
    const result = formatDate("2026-03-22 22:43:21");
    expect(result).toContain("22");
    expect(result).toContain("2026");
  });

  it("returns '-' for null/undefined", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDate(undefined)).toBe("-");
    expect(formatDate("")).toBe("-");
  });

  it("returns '-' for invalid date", () => {
    expect(formatDate("not-a-date")).toBe("-");
  });
});

describe("formatRelativeTime", () => {
  it("returns a relative string for recent dates", () => {
    const recent = new Date();
    recent.setMinutes(recent.getMinutes() - 5);
    const result = formatRelativeTime(recent.toISOString());
    expect(result).toContain("hace");
  });

  it("handles space-separated datetime (backend format)", () => {
    const recent = new Date();
    recent.setMinutes(recent.getMinutes() - 30);
    // Simulate backend format: "YYYY-MM-DD HH:MM:SS" in local time
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${recent.getFullYear()}-${pad(recent.getMonth() + 1)}-${pad(recent.getDate())} ${pad(recent.getHours())}:${pad(recent.getMinutes())}:${pad(recent.getSeconds())}`;
    const result = formatRelativeTime(dateStr);
    expect(result).toContain("hace");
  });

  it("returns '-' for null/undefined", () => {
    expect(formatRelativeTime(null)).toBe("-");
    expect(formatRelativeTime(undefined)).toBe("-");
  });
});

describe("getDateUrgencyClass", () => {
  it("returns red for past dates (overdue)", () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    expect(getDateUrgencyClass(past.toISOString())).toContain("red-600");
  });

  it("returns red-500 for dates within 7 days", () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 3);
    expect(getDateUrgencyClass(soon.toISOString())).toContain("red-500");
  });

  it("returns amber for dates within 14 days", () => {
    const upcoming = new Date();
    upcoming.setDate(upcoming.getDate() + 10);
    expect(getDateUrgencyClass(upcoming.toISOString())).toContain("amber");
  });

  it("returns empty for dates beyond 14 days", () => {
    const far = new Date();
    far.setDate(far.getDate() + 30);
    expect(getDateUrgencyClass(far.toISOString())).toBe("");
  });

  it("returns empty for null/undefined", () => {
    expect(getDateUrgencyClass(null)).toBe("");
    expect(getDateUrgencyClass(undefined)).toBe("");
  });
});

describe("normalizePhone", () => {
  it("strips +51 prefix", () => {
    expect(normalizePhone("+51940592068")).toBe("940592068");
  });

  it("strips 51 prefix for long numbers", () => {
    expect(normalizePhone("51940592068")).toBe("940592068");
  });

  it("removes spaces and dashes", () => {
    expect(normalizePhone("940-592-068")).toBe("940592068");
    expect(normalizePhone("940 592 068")).toBe("940592068");
  });

  it("leaves short numbers unchanged", () => {
    expect(normalizePhone("940592068")).toBe("940592068");
  });
});

describe("getInitials", () => {
  it("returns first two initials", () => {
    expect(getInitials("Daniel Rodriguez")).toBe("DR");
  });

  it("returns single initial for single name", () => {
    expect(getInitials("Daniel")).toBe("D");
  });

  it("limits to 2 characters", () => {
    expect(getInitials("Rosa Martinez Flores")).toBe("RM");
  });

  it("returns '??' for null/undefined", () => {
    expect(getInitials(null)).toBe("??");
    expect(getInitials(undefined)).toBe("??");
  });
});

describe("escapeHtml", () => {
  it("escapes HTML entities", () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
    );
  });

  it("returns empty for null/undefined", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });
});
