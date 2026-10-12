export function isMinorOnDate(birthDate: Date, localDate: Date) {
  const birthYear = birthDate.getUTCFullYear();
  const birthMonth = birthDate.getUTCMonth();
  const birthDay = birthDate.getUTCDate();
  const visitYear = localDate.getUTCFullYear();
  const visitMonth = localDate.getUTCMonth();
  const visitDay = localDate.getUTCDate();

  const age =
    visitYear -
    birthYear -
    (visitMonth < birthMonth ||
    (visitMonth === birthMonth && visitDay < birthDay)
      ? 1
      : 0);

  return age < 18;
}
