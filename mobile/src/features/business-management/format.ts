export function formatTurkishPrice(value: string) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return '₺0';

  return `₺${new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(numericValue)}`;
}
