
export function formatRF(amount: number): string {
  if (amount >= 1_000_000) {
    const formatted = (amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1);
    return `${formatted}M RF`;
  }
  if (amount >= 1_000) {
    const formatted = (amount / 1_000).toFixed(amount % 1_000 === 0 ? 0 : 1);
    return `${formatted}k RF`;
  }
  return `${amount} RF`;
}


export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-RW", {
    year: "numeric", month: "short", day: "numeric",
  });
}


export function currentYear(): number {
  return new Date().getFullYear();
}


export function getPaymentsForYear(
  payments: Array<{ amount: number; year: number }>,
  year: number
): number {
  return payments
    .filter((p) => p.year === year)
    .reduce((sum, p) => sum + p.amount, 0);
}
