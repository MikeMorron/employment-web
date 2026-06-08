import type { CompanyJobPost } from "@/types/workflows";
import type { Vacancy } from "@/types/vacancy";

export function presentCompanyJobAsVacancy(job: CompanyJobPost): Vacancy {
  return {
    id: job.id,
    titulo: job.title,
    publicadorTipo: "empresa",
    publicadorNombre: job.companyName,
    empresa: job.companyName,
    companyVerificationStatus: job.companyVerificationStatus,
    ubicacion: job.location,
    modalidad: job.modality,
    salario: job.salary,
    descripcion: job.description,
    descripcionCompleta: job.description,
    etiquetas: [...job.tags],
    destacada: job.featured,
    aplicantes: job.applicants.length,
    beneficios: [],
  };
}
