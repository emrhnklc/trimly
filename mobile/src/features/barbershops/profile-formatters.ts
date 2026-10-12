/** Addresses are saved as street, neighbourhood, district, province. */
export function formatBusinessLocation(address: string | null | undefined) {
  const parts = (address ?? "").split(",").map((part) => part.trim()).filter(Boolean);
  const last = parts.at(-1);
  if (!last) return "Adres eklenmemiş";
  // Legacy addresses already contain a district / province suffix.
  if (last.includes("/")) return last;
  if (parts.length >= 2) return `${parts.at(-2)} / ${last}`;
  return last;
}

export function formatBusinessPhone(phone: string | null | undefined) {
  if (!phone?.trim()) return "Telefon eklenmemiş";
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 14 && digits.startsWith("0090")) digits = `0${digits.slice(4)}`;
  else if (digits.length === 12 && digits.startsWith("90")) digits = `0${digits.slice(2)}`;
  else if (digits.length === 10 && digits.startsWith("5")) digits = `0${digits}`;
  if (digits.length !== 11 || !digits.startsWith("0")) return phone.trim();
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`;
}
