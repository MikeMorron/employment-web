"use client";

import { Check, X } from "lucide-react";
import {
  evaluatePasswordRequirements,
  MIN_PASSWORD_LENGTH,
  PASSWORD_ALLOWED_SPECIAL_CHARACTERS,
} from "@/lib/password-policy";

type PasswordRequirementsProps = {
  isEnglish: boolean;
  password: string;
};

function RequirementRow({
  complete,
  children,
}: {
  complete: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-white ${
          complete ? "bg-emerald-500" : "bg-red-500"
        }`}
      >
        {complete ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      </span>
      <span className="text-sm text-slate-700">{children}</span>
    </div>
  );
}

export function PasswordRequirements({ isEnglish, password }: PasswordRequirementsProps) {
  if (!password) {
    return null;
  }

  const requirements = evaluatePasswordRequirements(password);
  const completedCount = [
    requirements.minimumLengthMet,
    requirements.hasNumber,
    requirements.hasAllowedSpecialCharacter,
  ].filter(Boolean).length;
  const progress = Math.round((completedCount / 3) * 100);

  return (
    <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">
          {isEnglish ? "Password progress" : "Progreso de la contraseña"}
        </p>
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          {progress}%
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 via-sky-500 to-emerald-500 transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 space-y-3">
        <RequirementRow complete={requirements.minimumLengthMet}>
          {isEnglish ? `At least ${MIN_PASSWORD_LENGTH} characters` : `${MIN_PASSWORD_LENGTH} caracteres o más`}
        </RequirementRow>
        <RequirementRow complete={requirements.hasNumber}>
          {isEnglish ? "At least 1 number" : "Mínimo 1 número"}
        </RequirementRow>
        <RequirementRow complete={requirements.hasAllowedSpecialCharacter}>
          {isEnglish
            ? `At least 1 allowed special character (${PASSWORD_ALLOWED_SPECIAL_CHARACTERS})`
            : `Mínimo 1 caracter especial permitido (${PASSWORD_ALLOWED_SPECIAL_CHARACTERS})`}
        </RequirementRow>
      </div>

      {!requirements.hasOnlyAllowedCharacters || !requirements.hasNoWhitespace ? (
        <p className="mt-4 text-xs leading-6 text-red-600">
          {isEnglish
            ? `Use only letters, numbers, and these symbols: ${PASSWORD_ALLOWED_SPECIAL_CHARACTERS}. No spaces are allowed.`
            : `Usa solo letras, números y estos símbolos: ${PASSWORD_ALLOWED_SPECIAL_CHARACTERS}. No se permiten espacios.`}
        </p>
      ) : null}
    </div>
  );
}
