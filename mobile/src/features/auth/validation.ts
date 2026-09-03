export const passwordRequirements = [
  {
    id: "length",
    label: "En az 8 karakter",
    test: (value: string) => value.length >= 8,
  },
  {
    id: "uppercase",
    label: "En az 1 büyük harf",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    id: "lowercase",
    label: "En az 1 küçük harf",
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    id: "number",
    label: "En az 1 rakam",
    test: (value: string) => /\d/.test(value),
  },
  {
    id: "special",
    label: "En az 1 özel karakter",
    test: (value: string) => /[^A-Za-z0-9]/.test(value) && !/\s/.test(value),
  },
] as const;

export function isStrongPassword(value: string) {
  return (
    value.length <= 72 &&
    passwordRequirements.every((requirement) => requirement.test(value))
  );
}

export function formatTurkishMobileInput(value: string) {
  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("0090")) digits = digits.slice(4);
  else if (digits.startsWith("90")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);

  digits = digits.slice(0, 10);
  if (!digits) return "";

  const groups = [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 8),
    digits.slice(8, 10),
  ]
    .filter(Boolean)
    .join(" ");

  return `+90 ${groups}`;
}

export function normalizeTurkishMobile(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^90/, "");
  return /^5\d{9}$/.test(digits) ? `+90${digits}` : null;
}
