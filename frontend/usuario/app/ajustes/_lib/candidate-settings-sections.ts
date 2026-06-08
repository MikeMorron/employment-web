import {
  dataCollectionDetailsEn,
  dataCollectionDetailsEs,
  essentialCookiesDetailsEn,
  essentialCookiesDetailsEs,
  fullCookiesDetailsEn,
  fullCookiesDetailsEs,
} from "@/app/ajustes/_lib/settings-copy";
import type { Section } from "@/app/ajustes/_lib/settings-types";

export function buildCandidateSections(maskEmail: (email: string) => string): Section[] {
  return [
    {
      id: "security",
      sidebarEs: "Cuenta y seguridad",
      sidebarEn: "Account and security",
      titleEs: "Cuenta y seguridad",
      titleEn: "Account and security",
      copyEs: "Protege tu cuenta y controla el acceso.",
      copyEn: "Protect your account and control access.",
      blocks: [
        {
          titleEs: "Acceso",
          titleEn: "Access",
          items: [
            { id: "email", labelEs: "Email", labelEn: "Email", kind: "action", value: maskEmail("nina.adelard@talentsyncro.co") },
            { id: "password", labelEs: "Cambiar contraseña", labelEn: "Change password", kind: "action" },
          ],
        },
        {
          titleEs: "Seguridad",
          titleEn: "Security",
          items: [
            { id: "2fa", labelEs: "Activar 2FA", labelEn: "Enable 2FA", defaultOn: true },
            { id: "sessions", labelEs: "Sesiones activas", labelEn: "Active sessions", kind: "action", value: "Chrome en Linux · hace 12 min" },
            { id: "close-sessions", labelEs: "Cerrar todas las sesiones", labelEn: "Sign out from all sessions", kind: "action" },
          ],
        },
        {
          titleEs: "Cuenta",
          titleEn: "Account",
          items: [
            { id: "account-status", labelEs: "Estado de la cuenta", labelEn: "Account status", kind: "action", value: "Activa" },
            { id: "delete-account", labelEs: "Eliminar cuenta", labelEn: "Delete account", kind: "action", value: "Acción crítica" },
          ],
        },
      ],
    },
    {
      id: "visibility",
      sidebarEs: "Visibilidad y descubrimiento",
      sidebarEn: "Visibility and discovery",
      titleEs: "Visibilidad y descubrimiento",
      titleEn: "Visibility and discovery",
      copyEs: "Controla cómo apareces y cómo te encuentran las empresas.",
      copyEn: "Control how you appear and how companies find you.",
      blocks: [
        {
          titleEs: "Visibilidad",
          titleEn: "Visibility",
          items: [
            {
              id: "public-profile",
              labelEs: "Perfil visible públicamente",
              labelEn: "Public profile visibility",
              defaultOn: true,
              descriptionEs: "Permite que otros usuarios puedan ver tu perfil; si no, aparecerá como privado.",
              descriptionEn: "Allows other users to view your profile; otherwise it is shown as private.",
            },
          ],
        },
      ],
    },
    {
      id: "notifications",
      sidebarEs: "Notificaciones",
      sidebarEn: "Notifications",
      titleEs: "Notificaciones",
      titleEn: "Notifications",
      copyEs: "Organiza alertas útiles sin ruido innecesario.",
      copyEn: "Organize useful alerts without unnecessary noise.",
      blocks: [
        {
          titleEs: "Email",
          titleEn: "Email",
          items: [
            {
              id: "email-opportunities",
              labelEs: "Nuevas oportunidades",
              labelEn: "New opportunities",
              defaultOn: true,
              descriptionEs: "Envía un correo con trabajos relacionados con tu área o cargo. El envío queda listo para conectar el email final.",
              descriptionEn: "Sends an email with jobs related to your field or role. Delivery is ready to connect to the final email setup.",
            },
            {
              id: "email-companies",
              labelEs: "Empresas interesadas en ti",
              labelEn: "Companies interested in you",
              defaultOn: true,
              descriptionEs: "Te avisa por correo cuando 5 o más empresas distintas vean tu perfil e incluye cuáles fueron.",
              descriptionEn: "Emails you when 5 or more distinct companies view your profile and includes which companies they were.",
            },
            {
              id: "email-profile",
              labelEs: "Recomendaciones para mejorar tu perfil",
              labelEn: "Recommendations to improve profile",
              defaultOn: true,
              descriptionEs: "Activa o desactiva señales y avisos que mejoran tu compatibilidad y perfil.",
              descriptionEn: "Turns profile-improvement signals and compatibility hints on or off.",
            },
          ],
        },
        {
          titleEs: "Inteligente",
          titleEn: "Smart",
          items: [
            {
              id: "application-status-auto-close",
              labelEs: "Cerrar popup de postulación automáticamente",
              labelEn: "Auto-close application popup",
              defaultOn: true,
              descriptionEs: "Si está activo, el estado de la postulación se cierra a los 10 segundos. Si está inactivo, queda fijo hasta que lo cierres.",
              descriptionEn: "When enabled, the application status closes after 10 seconds. When disabled, it stays open until you close it.",
            },
            {
              id: "smart-match-threshold",
              labelEs: "Compatibilidad mínima para notificaciones",
              labelEn: "Minimum match for notifications",
              kind: "slider",
              min: 60,
              max: 95,
              value: 78,
              suffix: "%",
              descriptionEs: "Define desde qué porcentaje llegan alertas de coincidencias y trabajos nuevos.",
              descriptionEn: "Sets the minimum score for match and new-job alerts.",
            },
          ],
        },
      ],
    },
    {
      id: "match",
      sidebarEs: "Compatibilidad y recomendaciones",
      sidebarEn: "Match and recommendations",
      titleEs: "Compatibilidad y recomendaciones",
      titleEn: "Match and recommendations",
      copyEs: "Define cómo TalentSyncro selecciona oportunidades para ti.",
      copyEn: "Define how TalentSyncro selects opportunities for you.",
      blocks: [
        {
          titleEs: "Filtros inteligentes",
          titleEn: "Smart filters",
          items: [
            {
              id: "minimum-match",
              labelEs: "Compatibilidad mínima",
              labelEn: "Minimum match",
              kind: "slider",
              min: 60,
              max: 95,
              value: 82,
              suffix: "%",
              descriptionEs: "Define desde qué porcentaje empiezan a mostrarse coincidencias y vacantes nuevas.",
              descriptionEn: "Defines the threshold for showing matches and newly published jobs.",
            },
            {
              id: "verified-company-only",
              labelEs: "Mostrar solo vacantes con empresa verificada",
              labelEn: "Show only jobs with verified company",
              defaultOn: true,
              descriptionEs: "Muestra solo empresas con el icono de verificación junto al nombre.",
              descriptionEn: "Shows only companies with the verification badge next to their name.",
            },
          ],
        },
      ],
    },
    {
      id: "privacy",
      sidebarEs: "Privacidad y datos",
      sidebarEn: "Privacy and data",
      titleEs: "Privacidad y datos",
      titleEn: "Privacy and data",
      copyEs: "Tienes el control total sobre tu información.",
      copyEn: "You have total control over your information.",
      blocks: [
        {
          titleEs: "Uso de datos",
          titleEn: "Data usage",
          items: [
            {
              id: "data-collection",
              labelEs: "Recolección de datos",
              labelEn: "Data collection",
              kind: "action",
              value: "Mínima y completa",
              actionLabelEs: "Abrir",
              actionLabelEn: "Open",
              detailsEs: dataCollectionDetailsEs,
              detailsEn: dataCollectionDetailsEn,
            },
          ],
        },
        {
          titleEs: "Tracking",
          titleEn: "Tracking",
          items: [
            {
              id: "cookie-mode",
              labelEs: "Cookies",
              labelEn: "Cookies",
              kind: "choice",
              valueEs: "Esenciales",
              valueEn: "Essential",
              actionLabelEs: "Abrir",
              actionLabelEn: "Open",
              descriptionEs: "Elige entre cookies esenciales o completas; es informativo y no cambia la política interna.",
              descriptionEn: "Choose essential or full cookies; this is informative and does not change the internal policy.",
              detailsEs: [
                "Cookies Esenciales",
                ...essentialCookiesDetailsEs,
                "Cookies Completas",
                ...fullCookiesDetailsEs,
              ],
              detailsEn: [
                "Essential Cookies",
                ...essentialCookiesDetailsEn,
                "Full Cookies",
                ...fullCookiesDetailsEn,
              ],
              options: [
                {
                  id: "essential",
                  labelEs: "Esenciales",
                  labelEn: "Essential",
                  descriptionEs: "Mantienen sesión, seguridad y operación mínima.",
                  descriptionEn: "Keeps session, security, and minimum platform operation.",
                },
                {
                  id: "full",
                  labelEs: "Completas",
                  labelEn: "Full",
                  descriptionEs: "Habilitan recomendaciones, analítica y rendimiento.",
                  descriptionEn: "Enables recommendations, analytics, and performance signals.",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "plan",
      sidebarEs: "Plan actual",
      sidebarEn: "Current plan",
      titleEs: "Plan actual",
      titleEn: "Current plan",
      copyEs: "Consulta tu nivel actual y abre el modal protegido para comprar boosts.",
      copyEn: "Review your current tier and open the protected modal to buy boosts.",
      blocks: [],
    },
  ];
}
