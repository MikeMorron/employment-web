import { Search } from "lucide-react";
import { useUiCopy } from "@/lib/i18n/ui-copy";

export function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useUiCopy("search");
  return (
    <label className="block w-full">
      <span className="sr-only">{t("searchJobs")}</span>
      <div className="vacancy-search-shell relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-sky-300" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t("searchJobsPlaceholder")}
          className="w-full rounded-full bg-transparent py-3.5 pl-12 pr-4 text-sm text-[#eff7ff] outline-none placeholder:text-cyan-100/58"
        />
      </div>
    </label>
  );
}
