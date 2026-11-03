/**
 * Phone-number helpers shared by the auth API and the server actions.
 * Accepts Persian/Arabic digits and normalises Iranian country prefixes.
 */

const FA_DIGITS = /[\u06F0-\u06F9]/g;
const AR_DIGITS = /[\u0660-\u0669]/g;

export function toLatinDigits(input: string): string {
  return input
    .replace(FA_DIGITS, (char) => String(char.charCodeAt(0) - 0x06f0))
    .replace(AR_DIGITS, (char) => String(char.charCodeAt(0) - 0x0660));
}

/** `۰۹۱۲ ۱۱۱ ۰۰۰۱` / `+98912...` → `09121110001` */
export function cleanPhone(input: string): string {
  return toLatinDigits(String(input ?? ""))
    .replace(/[\s\-()]/g, "")
    .replace(/^(\+98|0098|98)/, "0");
}

export const isValidPhone = (phone: string): boolean => /^09\d{9}$/.test(phone);

export const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
