export function riderCallHref(phone?: string): string | undefined {
  const digits = phone?.replace(/\D/g, "") ?? "";
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(local) ? `tel:+91${local}` : undefined;
}