"use client";

import Image from "next/image";

import { EDUCATION_LABEL_MAP } from "@/components/profile/candidate-match-profile/constants";
import { formatDisplayDate } from "@/components/profile/candidate-match-profile/utils";
import type {
  CandidateCertificationProfile,
  CandidateEducationProfile,
} from "@/types/profile";

type PreviewImage = {
  src: string;
  title: string;
};

export function CandidateEducationSection({
  isDark,
  isEditing,
  sectionCardClassName,
  addButtonClassName,
  records,
  onAdd,
  onRemove,
}: {
  isDark: boolean;
  isEditing: boolean;
  sectionCardClassName: string;
  addButtonClassName: string;
  records: CandidateEducationProfile["records"];
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <section className={`${sectionCardClassName} p-4`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className={isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-950"}>
          Educación
        </h3>
        {isEditing ? (
          <button type="button" onClick={onAdd} className={`${addButtonClassName} px-4 py-2`}>
            Agregar estudio
          </button>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3">
        {records.map((record, index) => (
          <div key={`${record.institutionName}-${index}`} className="rounded-[1rem] border border-slate-200 bg-white/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {record.educationType ? EDUCATION_LABEL_MAP[record.educationType] ?? record.degreeTitle : record.degreeTitle}
                </p>
                <p className="mt-1 text-sm text-slate-700">{record.institutionName}</p>
                {record.degreeField ? (
                  <p className="mt-1 text-xs text-slate-500">{record.degreeField}</p>
                ) : null}
                <p className="mt-1 text-xs text-slate-500">
                  {[record.region, record.city].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {[formatDisplayDate(record.startDate), formatDisplayDate(record.endDate)].filter(Boolean).join(" - ")}
                </p>
                {record.focusAreas?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {record.focusAreas.map((focusArea) => (
                      <span key={focusArea} className="inline-flex items-center rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs font-medium text-sky-700">
                        {focusArea}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              {isEditing ? (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700"
                >
                  Eliminar
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CandidateCertificationSection({
  isDark,
  isEditing,
  sectionCardClassName,
  addButtonClassName,
  records,
  onAdd,
  onRemove,
  onPreview,
}: {
  isDark: boolean;
  isEditing: boolean;
  sectionCardClassName: string;
  addButtonClassName: string;
  records: CandidateCertificationProfile["records"];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onPreview: (preview: PreviewImage) => void;
}) {
  return (
    <section className={`${sectionCardClassName} p-4`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className={isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-950"}>
          Certificaciones
        </h3>
        {isEditing ? (
          <button type="button" onClick={onAdd} className={`${addButtonClassName} px-4 py-2`}>
            Agregar certificación
          </button>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3">
        {records.map((record, index) => (
          <div key={`${record.certificationName}-${index}`} className="rounded-[1rem] border border-slate-200 bg-white/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{record.certificationName}</p>
                <p className="mt-1 text-sm text-slate-700">{record.issuer}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {[formatDisplayDate(record.startedAt), formatDisplayDate(record.completedAt)].filter(Boolean).join(" - ")}
                </p>
                {record.proofImageThumbnailUrl ? (
                  <button
                    type="button"
                    onClick={() =>
                      onPreview({
                        src: record.proofImageUrl || record.proofImageThumbnailUrl || "",
                        title: record.proofImageName ?? record.certificationName,
                      })
                    }
                    className="mt-3 block"
                  >
                    <div className="aspect-[4/3] w-full max-w-[360px] overflow-hidden rounded-[1rem] border border-slate-200 bg-slate-100">
                      <Image
                        src={record.proofImageThumbnailUrl}
                        alt={record.proofImageName ?? record.certificationName}
                        width={320}
                        height={240}
                        unoptimized
                        className="h-full w-full object-contain"
                      />
                    </div>
                  </button>
                ) : null}
                {record.proofImageName ? (
                  <p className="mt-1 text-xs text-slate-500">{record.proofImageName}</p>
                ) : null}
              </div>
              {isEditing ? (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700"
                >
                  Eliminar
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CandidateCertificationPreviewModal({
  isDark,
  previewCertificationImage,
  onClose,
}: {
  isDark: boolean;
  previewCertificationImage: PreviewImage | null;
  onClose: () => void;
}) {
  if (!previewCertificationImage) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[240] flex items-center justify-center px-4">
      <button
        type="button"
        className={isDark ? "absolute inset-0 bg-slate-950/82 backdrop-blur-sm" : "absolute inset-0 bg-slate-900/48 backdrop-blur-sm"}
        onClick={onClose}
        aria-label="Cerrar vista previa"
      />
      <div className={`relative w-full max-w-[900px] rounded-[1.6rem] border p-4 ${isDark ? "border-cyan-300/16 bg-slate-950" : "border-slate-200 bg-white"}`}>
        <p className={isDark ? "mb-3 text-sm font-semibold text-slate-200" : "mb-3 text-sm font-semibold text-slate-700"}>
          {previewCertificationImage.title}
        </p>
        <div className="flex justify-center">
          <Image
            src={previewCertificationImage.src}
            alt={previewCertificationImage.title}
            width={900}
            height={675}
            unoptimized
            className="max-h-[85vh] w-full max-w-[900px] object-contain"
          />
        </div>
      </div>
    </div>
  );
}
