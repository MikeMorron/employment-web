import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicCompanyProfileBySlug } from "@/backend/lib-server/company-public";

export default async function CompanyPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await getPublicCompanyProfileBySlug(slug);

  if (!company) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link href="/vacantes" className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">
          Volver
        </Link>
        <section className="rounded-[2rem] border border-slate-300 bg-white p-6">
          <h1 className="text-3xl font-semibold text-slate-950">{company.name}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-700">{company.about}</p>
        </section>
        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-[1.5rem] border border-slate-300 bg-white p-5">
            <h2 className="text-xl font-semibold text-slate-950">Datos</h2>
            <p className="mt-3 text-sm text-slate-700">{company.location ?? "Ubicación no disponible"}</p>
            <p className="mt-2 text-sm text-slate-700">{company.area ?? "Área no disponible"}</p>
            <p className="mt-2 text-sm text-slate-700">{company.companySize ?? "Tamaño no disponible"}</p>
          </article>
          <article className="rounded-[1.5rem] border border-slate-300 bg-white p-5">
            <h2 className="text-xl font-semibold text-slate-950">Ofertas activas</h2>
            <div className="mt-4 space-y-3">
              {company.activeJobs.map((job) => (
                <div key={job.id} className="rounded-[1rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-950">{job.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{job.location} · {job.modality}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
