import { LegalPageShell } from "@/components/legal/legal-page-shell";

export default function PrivacidadPage() {
  return (
    <LegalPageShell
      eyebrow="Legal"
      title="Privacidad"
      intro="Esta política resume la recolección mínima y el uso funcional de datos dentro de la versión actual del producto."
    >
      <div>
        <h2 className="text-base font-semibold text-inherit">1. Recolección operativa y funcional</h2>
        <p className="mt-2">
          Recopilamos únicamente la información necesaria para permitir el funcionamiento correcto
          de la plataforma y facilitar la conexión entre candidatos y empresas. Los datos
          solicitados, como nombre, correo electrónico, número de contacto, ubicación, experiencia
          laboral y hoja de vida, se utilizan para crear y administrar la cuenta, permitir
          postulaciones, mostrar vacantes relevantes y mejorar la experiencia dentro de la
          plataforma.
        </p>
      </div>
      <div>
        <h2 className="text-base font-semibold text-inherit">2. Seguridad, calidad y mejora del servicio</h2>
        <p className="mt-2">
          Esta información también ayuda a validar perfiles, mantener la seguridad básica del
          servicio, detectar errores técnicos y sostener un proceso de búsqueda y contratación más
          eficiente.
        </p>
      </div>
      <div>
        <h2 className="text-base font-semibold text-inherit">3. Control del usuario</h2>
        <p className="mt-2">
          El usuario puede ajustar visibilidad pública, alertas por correo, umbrales de
          compatibilidad y el modo de cookies desde la pantalla de ajustes.
        </p>
      </div>
    </LegalPageShell>
  );
}
