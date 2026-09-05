const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateGuestCode() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (value) => ALPHABET[value % ALPHABET.length]);
  return `${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
}

export function normalizeGuestCode(value: string) {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (compact.length !== 8) {
    return null;
  }
  return `${compact.slice(0, 4)}-${compact.slice(4)}`;
}

export function guestEmail(code: string) {
  return `guest-${code.replace("-", "").toLowerCase()}@flick.guest`;
}

export function isGuestEmail(email: string) {
  return email.endsWith("@flick.guest");
}
