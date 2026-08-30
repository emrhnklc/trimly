export function formatCompactRevenue(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount === 0) return '₺0';

  if (amount >= 1_000_000) {
    return `₺${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(amount / 1_000_000)} Mn`;
  }

  if (amount >= 1_000) {
    return `₺${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(amount / 1_000)} B`;
  }

  return `₺${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(amount)}`;
}
