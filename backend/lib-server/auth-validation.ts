import { isValidRegistrationPassword } from "@/lib/password-policy";

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizeEmail(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().toLowerCase();
}

export function isStrongEnoughPassword(password: string): boolean {
  return isValidRegistrationPassword(password);
}
