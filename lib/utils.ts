import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// Parse date string that may or may not have ISO T separator
function parseDate(dateStr: string): Date {
  // Handle "2026-03-22 22:43:21" format (backend) by replacing space with T
  const normalized = dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T");
  return parseISO(normalized);
}

// Merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date for display
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    return format(parseDate(dateStr), "dd MMM yyyy", { locale: es });
  } catch {
    return "-";
  }
}

// Format relative time (e.g., "hace 5 min")
export function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    return formatDistanceToNow(parseDate(dateStr), {
      addSuffix: true, 
      locale: es 
    });
  } catch {
    return "-";
  }
}

// Get urgency class for dates
export function getDateUrgencyClass(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const date = parseDate(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "text-red-600 font-semibold"; // Vencido
    if (diffDays <= 7) return "text-red-500 font-medium";  // Urgente
    if (diffDays <= 14) return "text-amber-500";           // Próximo
    return "";
  } catch {
    return "";
  }
}

// Normalize phone number (remove +51, 51, spaces, dashes)
export function normalizePhone(phone: string): string {
  let normalized = phone.replace(/[\s\-\(\)]/g, "");
  if (normalized.startsWith("+51")) {
    normalized = normalized.slice(3);
  } else if (normalized.startsWith("51") && normalized.length > 9) {
    normalized = normalized.slice(2);
  }
  return normalized;
}

// Get initials from name
export function getInitials(name?: string | null): string {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Escape HTML
export function escapeHtml(text?: string | null): string {
  if (!text) return "";
  return text.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[m] || m));
}

// Sleep utility
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
