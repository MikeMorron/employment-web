import { getCandidateProfileCompleteness } from "@/lib/server/candidate/profile-completeness";
import { getCompanyProfileCompleteness } from "@/lib/server/company/profile-completeness";

export const LOW_PROFILE_COMPLETENESS_THRESHOLD = 60;
export const PROFILE_REMINDER_COOLDOWN_DAYS = 21;
export const PROFILE_REMINDER_COOLDOWN_MS =
  PROFILE_REMINDER_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export function getProfileReminderWindowKey(now = Date.now()) {
  return Math.floor(now / PROFILE_REMINDER_COOLDOWN_MS);
}

export {
  getCandidateProfileCompleteness,
  getCompanyProfileCompleteness,
};
