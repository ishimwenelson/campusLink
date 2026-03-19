
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-RW", {
    style:    "decimal",
    maximumFractionDigits: 0,
  }).format(amount) + " RF";
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function getMembershipYear(createdAt: string): number {
  const created = new Date(createdAt);
  const now     = new Date();
  return Math.min(
    Math.ceil((now.getFullYear() - created.getFullYear()) + 1),
    5
  );
}

export function downloadCSV(data: Record<string, unknown>[], filename: string) {
  const headers = Object.keys(data[0] ?? {});
  const rows = data.map((row) =>
    headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")
  );
  const csv  = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
