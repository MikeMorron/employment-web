type TemplatePayload = Record<string, unknown> | null | undefined;

type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

function getString(payload: TemplatePayload, key: string, fallback = "") {
  const value = payload?.[key];
  return typeof value === "string" ? value : fallback;
}

function getNumber(payload: TemplatePayload, key: string, fallback = 0) {
  const value = payload?.[key];
  return typeof value === "number" ? value : fallback;
}

function getJobs(payload: TemplatePayload) {
  const jobs = payload?.jobs;
  return Array.isArray(jobs) ? jobs : [];
}

function wrapEmail(title: string, body: string, ctaHref?: string) {
  const cta = ctaHref
    ? `<p style="margin-top:24px;"><a href="${ctaHref}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#0f172a;color:#fff;text-decoration:none;font-weight:600;">Abrir TalentSyncro</a></p>`
    : "";

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;">
      <h1 style="font-size:22px;margin-bottom:12px;">${title}</h1>
      <div>${body}</div>
      ${cta}
    </div>
  `;
}

export function renderRetentionEmail(kind: string, payload: TemplatePayload): RenderedEmail {
  const ctaHref = getString(payload, "ctaHref", "/");

  switch (kind) {
    case "new_application_received": {
      const candidateName = getString(payload, "candidateName", "Nuevo candidato");
      const title = getString(payload, "title", "tu vacante");
      const subject = `Nueva postulación para ${title}`;
      const text = `${candidateName} aplicó a ${title}. Revisa su perfil en TalentSyncro.`;
      return {
        subject,
        text,
        html: wrapEmail(subject, `<p>${text}</p>`, ctaHref),
      };
    }
    case "recommended_candidates_available":
    case "new_candidate_match": {
      const count = getNumber(payload, "count", 0);
      const subject = count > 1
        ? `Tienes ${count} candidatos recomendados`
        : "Tienes un candidato recomendado";
      const text = count > 1
        ? `Detectamos ${count} candidatos con alto potencial de match para tus vacantes activas.`
        : "Detectamos un candidato con alto potencial de match para tus vacantes activas.";
      return {
        subject,
        text,
        html: wrapEmail(subject, `<p>${text}</p>`, ctaHref),
      };
    }
    case "pipeline_stalled": {
      const count = getNumber(payload, "count", 0);
      const subject = "Tu pipeline está detenido";
      const text = `Tienes ${count} candidatos sin revisar o procesos sin movimiento reciente.`;
      return {
        subject,
        text,
        html: wrapEmail(subject, `<p>${text}</p>`, ctaHref),
      };
    }
    case "application_status_changed": {
      const companyName = getString(payload, "companyName", "una empresa");
      const title = getString(payload, "title", "tu postulación");
      const status = getString(payload, "status", "actualizado");
      const subject = `Tu estado cambió en ${title}`;
      const text = `${companyName} actualizó tu proceso a ${status}.`;
      return {
        subject,
        text,
        html: wrapEmail(subject, `<p>${text}</p>`, ctaHref),
      };
    }
    case "new_matching_job": {
      const jobs = getJobs(payload)
        .map((job) => `${getString(job as TemplatePayload, "title")} · ${getString(job as TemplatePayload, "companyName")}`)
        .filter(Boolean);
      const subject = jobs.length > 1
        ? `Nuevas vacantes que encajan contigo (${jobs.length})`
        : "Nueva vacante que encaja contigo";
      const list = jobs.length > 0 ? `<ul>${jobs.map((job) => `<li>${job}</li>`).join("")}</ul>` : "";
      const text = jobs.length > 0
        ? `Encontramos vacantes alineadas con tu perfil: ${jobs.join(", ")}.`
        : "Encontramos nuevas vacantes alineadas con tu perfil.";
      return {
        subject,
        text,
        html: wrapEmail(subject, `<p>${text}</p>${list}`, ctaHref),
      };
    }
    case "profile_interest_digest": {
      const count = getNumber(payload, "count", 0);
      const companies = Array.isArray(payload?.companies)
        ? payload.companies.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        : [];
      const subject = count > 1
        ? `Más de ${count} empresas vieron tu perfil`
        : "Una empresa vio tu perfil";
      const companyList = companies.length > 0
        ? `<ul>${companies.map((company) => `<li>${company}</li>`).join("")}</ul>`
        : "";
      const text = companies.length > 0
        ? `Estas empresas revisaron tu perfil recientemente: ${companies.join(", ")}.`
        : `Más de ${count} empresas revisaron tu perfil recientemente.`;

      return {
        subject,
        text,
        html: wrapEmail(subject, `<p>${text}</p>${companyList}`, ctaHref),
      };
    }
    case "profile_incomplete": {
      const progressPercent = getNumber(payload, "progressPercent", 0);
      const subject = "Completa tu perfil";
      const text = `Tu perfil va en ${progressPercent}%. Completarlo aumenta visibilidad y acelera tu primer valor.`;
      return {
        subject,
        text,
        html: wrapEmail(subject, `<p>${text}</p>`, ctaHref),
      };
    }
    case "saved_job_reminder": {
      const count = getNumber(payload, "count", 0);
      const subject = "Tienes vacantes guardadas pendientes";
      const text = `Guardaste ${count} vacantes y aún no las has movido a aplicación.`;
      return {
        subject,
        text,
        html: wrapEmail(subject, `<p>${text}</p>`, ctaHref),
      };
    }
    case "job_low_conversion": {
      const jobs = getJobs(payload)
        .map((job) => getString(job as TemplatePayload, "title"))
        .filter(Boolean);
      const subject = "Hay vacantes con baja actividad";
      const text = jobs.length > 0
        ? `Estas vacantes muestran poca tracción: ${jobs.join(", ")}.`
        : "Detectamos vacantes con baja actividad reciente.";
      return {
        subject,
        text,
        html: wrapEmail(subject, `<p>${text}</p>`, ctaHref),
      };
    }
    case "plan_limit_reached": {
      const limit = getNumber(payload, "activeJobsLimit", 0);
      const subject = "Llegaste al límite de tu plan";
      const text = `Tu plan actual soporta ${limit} vacantes activas. Si necesitas más, revisa una mejora de plan.`;
      return {
        subject,
        text,
        html: wrapEmail(subject, `<p>${text}</p>`, ctaHref),
      };
    }
    default: {
      const subject = "Actualización de TalentSyncro";
      const text = "Tienes una actualización pendiente en tu cuenta.";
      return {
        subject,
        text,
        html: wrapEmail(subject, `<p>${text}</p>`, ctaHref),
      };
    }
  }
}
