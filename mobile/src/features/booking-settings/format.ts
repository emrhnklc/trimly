export function formatMinutes(minutes: number) {
  if (minutes === 0) return 'Hemen';
  if (minutes < 60) return `${minutes} dk`;
  if (minutes % 1440 === 0) return `${minutes / 1440} gün`;
  if (minutes % 60 === 0) return `${minutes / 60} saat`;
  return `${Math.floor(minutes / 60)} sa ${minutes % 60} dk`;
}
