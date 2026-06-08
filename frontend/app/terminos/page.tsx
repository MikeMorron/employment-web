import { LegalPageShell } from "@/components/legal/legal-page-shell";

export default function TerminosPage() {
  return (
    <LegalPageShell
      eyebrow="Legal"
      title="Términos y condiciones"
      intro="Este texto deja una base visible dentro del producto mientras se termina la versión jurídica final. Define el uso general de TalentSyncro para candidatos y empresas."
    >
      <div>
        <h2 className="text-base font-semibold text-inherit">1. Uso de la plataforma</h2>
        <p className="mt-2">
          TalentSyncro ofrece herramientas para descubrir vacantes, organizar postulaciones,
          mostrar perfiles y operar paneles de contratación. El usuario es responsable de la
          exactitud de la información que publica.
        </p>
      </div>
      <div>
        <h2 className="text-base font-semibold text-inherit">2. Cuentas</h2>
        <p className="mt-2">
          Cada cuenta debe mantenerse segura. El acceso compartido, la suplantación y el uso de
          datos falsos pueden causar suspensión de acceso o restricción de funciones.
        </p>
      </div>
      <div>
        <h2 className="text-base font-semibold text-inherit">3. Publicación y visibilidad</h2>
        <p className="mt-2">
          La visibilidad de perfiles, vacantes y coincidencias puede variar según configuración,
          integridad del perfil, actividad y productos de impulso contratados dentro de la
          plataforma.
        </p>
      </div>
      <div>
        <h2 className="text-base font-semibold text-inherit">4. Conducta permitida</h2>
        <p className="mt-2">
          No se permite contenido engañoso, discriminatorio, ofensivo o que viole la ley. Tampoco
          está permitido intentar extraer información privada por medios no autorizados.
        </p>
      </div>
    </LegalPageShell>
  );
}
