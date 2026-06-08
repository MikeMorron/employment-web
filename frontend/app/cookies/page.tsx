import { LegalPageShell } from "@/components/legal/legal-page-shell";
import {
  essentialCookiesDetailsEs,
  fullCookiesDetailsEs,
} from "@/app/ajustes/_lib/settings-copy";

export default function CookiesPage() {
  return (
    <LegalPageShell
      eyebrow="Legal"
      title="Cookies"
      intro="Estas notas explican el uso funcional de cookies y almacenamiento local con la misma estructura mostrada en Ajustes."
    >
      <div>
        <h2 className="text-base font-semibold text-inherit">1. Cookies esenciales</h2>
        <ul className="mt-2 space-y-2">
          {essentialCookiesDetailsEs.map((detail) => (
            <li key={detail}>• {detail}</li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-base font-semibold text-inherit">2. Cookies completas</h2>
        <ul className="mt-2 space-y-2">
          {fullCookiesDetailsEs.map((detail) => (
            <li key={detail}>• {detail}</li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-base font-semibold text-inherit">3. Gestión</h2>
        <p className="mt-2">
          El usuario puede mantener solo cookies esenciales o habilitar cookies completas desde la
          sección de ajustes y privacidad. Esta selección es informativa y deja lista la política
          interna para la versión final.
        </p>
      </div>
    </LegalPageShell>
  );
}
