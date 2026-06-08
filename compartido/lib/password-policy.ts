export const MIN_PASSWORD_LENGTH = 10;
export const PASSWORD_ALLOWED_SPECIAL_CHARACTERS = "@#$%*!-.";
const PASSWORD_ALLOWED_SPECIALS_CLASS = "@#$%*!\\-.";
const PASSWORD_ALLOWED_CHARACTERS = new RegExp(`^[A-Za-z0-9${PASSWORD_ALLOWED_SPECIALS_CLASS}]+$`);
const PASSWORD_SPECIAL_CHARACTER = new RegExp(`[${PASSWORD_ALLOWED_SPECIALS_CLASS}]`);

export type PasswordRequirementState = {
  minimumLengthMet: boolean;
  hasNumber: boolean;
  hasAllowedSpecialCharacter: boolean;
  hasOnlyAllowedCharacters: boolean;
  hasNoWhitespace: boolean;
};

export function evaluatePasswordRequirements(password: string): PasswordRequirementState {
  return {
    minimumLengthMet: password.length >= MIN_PASSWORD_LENGTH,
    hasNumber: /\d/.test(password),
    hasAllowedSpecialCharacter: PASSWORD_SPECIAL_CHARACTER.test(password),
    hasOnlyAllowedCharacters: password.length === 0 ? true : PASSWORD_ALLOWED_CHARACTERS.test(password),
    hasNoWhitespace: !/\s/.test(password),
  };
}

export function isValidRegistrationPassword(password: string): boolean {
  const requirements = evaluatePasswordRequirements(password);

  return (
    requirements.minimumLengthMet &&
    requirements.hasNumber &&
    requirements.hasAllowedSpecialCharacter &&
    requirements.hasOnlyAllowedCharacters &&
    requirements.hasNoWhitespace
  );
}
