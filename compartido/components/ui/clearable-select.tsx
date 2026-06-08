"use client";

import { ChevronDown, X } from "lucide-react";

type SelectOption = {
  value: string;
  label: string;
};

type ClearableSelectProps = {
  value: string;
  options: SelectOption[];
  placeholder: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  disabled?: boolean;
  className: string;
  buttonClassName?: string;
  selectClassName?: string;
  id?: string;
  name?: string;
  "data-profile-focus"?: string;
};

export function ClearableSelect({
  value,
  options,
  placeholder,
  onChange,
  onClear,
  disabled = false,
  className,
  buttonClassName,
  selectClassName = "",
  id,
  name,
  "data-profile-focus": dataProfileFocus,
}: ClearableSelectProps) {
  return (
    <div className={`relative ${className}`}>
      <select
        id={id}
        name={name}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full appearance-none pr-12 ${selectClassName}`}
        data-profile-focus={dataProfileFocus}
      >
        <option value="" disabled hidden>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={`${option.value}-${option.label}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {value && !disabled ? (
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onClear ?? (() => onChange(""))}
          className={buttonClassName}
          aria-label={`Limpiar ${placeholder.toLowerCase()}`}
        >
          <X className="h-4 w-4" />
        </button>
      ) : (
        <span className="pointer-events-none absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center text-slate-400">
          <ChevronDown className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}
