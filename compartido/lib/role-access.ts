import type { Plan, UserRole } from "@/types/account";
import { normalizeCompanyPlan } from "@/lib/company-plan-model";

export const ROLE_ROUTES = {
  candidate: ["/", "/vacantes", "/matches", "/postulaciones", "/chat", "/guardado", "/invitaciones", "/perfil", "/perfil/me", "/ajustes"],
  company: ["/", "/candidatos", "/publicadas", "/analytics", "/chat", "/guardado", "/perfil", "/perfil/me", "/ajustes"],
  admin: ["/", "/admin", "/admin/usuarios", "/admin/vacantes", "/perfil", "/perfil/me", "/ajustes"],
} as const;

export function getRoleHomePath(role: UserRole) {
  return role === "company" ? "/analytics" : role === "admin" ? "/admin" : "/vacantes";
}

export function getForbiddenRouteRedirect(role: UserRole) {
  return role === "company" ? "/analytics" : role === "admin" ? "/admin" : "/vacantes";
}

export function canAccessRoute(role: UserRole, pathname: string) {
  if (role === "admin") {
    return pathname === "/" || pathname === "/perfil" || pathname === "/perfil/me" || pathname === "/ajustes" || pathname.startsWith("/admin");
  }

  if (pathname === "/" || pathname === "/perfil" || pathname === "/perfil/me" || pathname === "/ajustes" || pathname === "/vacantes" || pathname === "/guardado" || pathname === "/chat") {
    return true;
  }

  if (role === "candidate") {
    return !["/analytics", "/candidatos", "/publicadas"].includes(pathname);
  }

  return !["/matches", "/postulaciones"].includes(pathname);
}

export function getUpgradeCtaCopy(role: UserRole, plan: Plan, isEnglish: boolean) {
  if (role === "company") {
    const normalizedPlan = normalizeCompanyPlan(plan);
    return {
      title: isEnglish
        ? "Need more active hiring capacity?"
        : "¿Necesitas más capacidad de contratación activa?",
      copy: isEnglish
        ? normalizedPlan === "premium"
          ? "Premium keeps top candidates closer, prioritizes boosted talent, and unlocks the broadest hiring capacity."
          : normalizedPlan === "business"
            ? "Business gives you urgent jobs, analytics, stronger matching, and more active hiring capacity."
            : normalizedPlan === "pro"
              ? "Move up to Business or Premium to unlock urgent jobs, analytics, and stronger prioritization."
              : "Upgrade from Basic to unlock more active jobs, smarter filters, and a cleaner recruiting pipeline."
        : normalizedPlan === "premium"
          ? "Premium acerca a los mejores candidatos, prioriza talento con boost y desbloquea la mayor capacidad de contratación."
          : normalizedPlan === "business"
            ? "Business te da urgencias, analítica, mejor matching y más capacidad de contratación activa."
            : normalizedPlan === "pro"
              ? "Sube a Business o Premium para desbloquear urgencias, analítica y una priorización más fuerte."
              : "Sube desde Básico para desbloquear más vacantes activas, filtros más inteligentes y un pipeline más limpio.",
      action: isEnglish ? "Review company plans" : "Revisar planes de empresa",
    };
  }

  return {
    title: isEnglish
      ? "Want more visibility in company searches?"
      : "¿Quieres más visibilidad en las búsquedas de empresas?",
    copy: isEnglish
      ? plan === "pro"
        ? "Your strongest boost tier is active. Use the higher visibility, extra application capacity, and smarter alerts to convert more opportunities."
        : plan === "boosted"
          ? "You already have an active boost tier. Upgrade forward if you need more inventory, visibility time, and extra applications."
          : "Compare boost plans to unlock more visibility time, stronger ranking, and extra applications."
      : plan === "pro"
        ? "Tu nivel de boost más fuerte está activo. Usa la mayor visibilidad, la capacidad extra de postulaciones y las alertas mejoradas para convertir más oportunidades."
        : plan === "boosted"
          ? "Ya tienes un nivel de boost activo. Sube hacia adelante si necesitas más inventario, más tiempo de visibilidad y más postulaciones."
          : "Compara planes de boost para desbloquear más tiempo de visibilidad, mejor posicionamiento y postulaciones extra.",
    action: isEnglish ? "Review boost plans" : "Revisar planes de boost",
  };
}
