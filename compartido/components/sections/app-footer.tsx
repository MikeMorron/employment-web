import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} TalentSyncro · Hecho en Colombia 🇨🇴
          </p>
          <nav className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <Link href="/terminos" className="hover:text-slate-800 transition">Términos</Link>
            <Link href="/privacidad" className="hover:text-slate-800 transition">Privacidad</Link>
            <Link href="/cookies" className="hover:text-slate-800 transition">Cookies</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
