"use client";

export function ToggleSwitch({
  isDark,
  checked,
  onChange,
}: {
  isDark: boolean;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onChange}
      className={`relative inline-flex h-8 w-14 items-center rounded-full border transition duration-300 ${
        checked
          ? isDark
            ? "border-emerald-300/40 bg-emerald-400/20"
            : "border-emerald-300 bg-emerald-100"
          : isDark
            ? "border-rose-300/30 bg-rose-400/16"
            : "border-rose-300 bg-rose-100"
      }`}
    >
      <span
        className={`inline-flex h-6 w-6 transform items-center justify-center rounded-full text-[10px] font-bold transition duration-300 ${
          checked
            ? `translate-x-7 ${isDark ? "bg-emerald-300 text-[#042234]" : "bg-emerald-500 text-white"}`
            : `translate-x-1 ${isDark ? "bg-rose-200 text-rose-700" : "bg-rose-500 text-white"}`
        }`}
      >
        {checked ? "ON" : "OFF"}
      </span>
    </button>
  );
}
