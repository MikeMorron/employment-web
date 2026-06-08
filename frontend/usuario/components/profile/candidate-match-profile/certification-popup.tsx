"use client";

import Image from "next/image";
import { ImageUp } from "lucide-react";
import { PopupShell } from "@/components/profile/candidate-match-profile/shared";
import { popupFieldClassName } from "@/components/profile/candidate-match-profile/utils";
import type { CertificationPopupProps } from "@/components/profile/candidate-match-profile/popup-types";

export function CertificationPopup({
  isDark,
  profileUi,
  showCertificationPopup,
  certificationDraft,
  certificationErrors,
  isCertificationUploading,
  uploadingCertificationName,
  certificationFileInputRef,
  onCancel,
  onConfirm,
  onUploadCertificationImage,
  onCertificationDraftChange,
  onCertificationErrorsChange,
  onPreviewCertificationImageChange,
}: CertificationPopupProps) {
  if (!showCertificationPopup) {
    return null;
  }

  return (
    <PopupShell
      title="Agregar certificación"
      isDark={isDark}
      onCancel={onCancel}
      onConfirm={onConfirm}
      confirmLabel="Guardar"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nombre de la entidad</span>
          <input
            type="text"
            value={certificationDraft.issuer}
            onChange={(event) => {
              onCertificationErrorsChange((current) => ({
                ...current,
                issuer: false,
                proofImageName: false,
              }));
              onCertificationDraftChange((current) => ({
                ...current,
                issuer: event.target.value,
                proofImageName: "",
                proofImageAssetId: "",
                proofImageAssetPublicId: "",
                proofImageUrl: "",
                proofImageThumbnailUrl: "",
                proofImageStoredFileName: "",
                proofImageThumbnailStoredFileName: "",
              }));
            }}
            className={popupFieldClassName(`mt-2 ${profileUi.input}`, Boolean(certificationErrors.issuer))}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Programa cursado</span>
          <input
            type="text"
            value={certificationDraft.certificationName}
            onChange={(event) => {
              onCertificationErrorsChange((current) => ({
                ...current,
                certificationName: false,
                proofImageName: false,
              }));
              onCertificationDraftChange((current) => ({
                ...current,
                certificationName: event.target.value,
                proofImageName: "",
                proofImageAssetId: "",
                proofImageAssetPublicId: "",
                proofImageUrl: "",
                proofImageThumbnailUrl: "",
                proofImageStoredFileName: "",
                proofImageThumbnailStoredFileName: "",
              }));
            }}
            className={popupFieldClassName(`mt-2 ${profileUi.input}`, Boolean(certificationErrors.certificationName))}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Fecha entrada</span>
          <input
            type="date"
            value={certificationDraft.startedAt}
            onChange={(event) => {
              onCertificationErrorsChange((current) => ({ ...current, startedAt: false }));
              onCertificationDraftChange((current) => ({ ...current, startedAt: event.target.value }));
            }}
            className={popupFieldClassName(`mt-2 ${profileUi.input}`, Boolean(certificationErrors.startedAt))}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Fecha grado</span>
          <input
            type="date"
            value={certificationDraft.completedAt}
            onChange={(event) => {
              onCertificationErrorsChange((current) => ({ ...current, completedAt: false }));
              onCertificationDraftChange((current) => ({ ...current, completedAt: event.target.value }));
            }}
            className={popupFieldClassName(`mt-2 ${profileUi.input}`, Boolean(certificationErrors.completedAt))}
          />
        </label>
        <div className="md:col-span-2">
          <input
            ref={certificationFileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
            className="hidden"
            onChange={async (event) => {
              const input = event.currentTarget;
              const file = input.files?.[0];
              if (!file) {
                return;
              }
              const lowerName = file.name.toLowerCase();
              const isValid =
                (file.type === "image/png" && lowerName.endsWith(".png")) ||
                (file.type === "image/jpeg" && (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")));
              if (!isValid) {
                onCertificationErrorsChange((current) => ({ ...current, proofImageName: true }));
                input.value = "";
                return;
              }
              await onUploadCertificationImage(file);
              input.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => certificationFileInputRef.current?.click()}
            className={popupFieldClassName(`${profileUi.buttonSecondary} px-4 py-2`, Boolean(certificationErrors.proofImageName))}
          >
            <span className="inline-flex items-center gap-2">
              <ImageUp className="h-4 w-4" />
              Subir foto JPG o PNG
            </span>
          </button>
          {isCertificationUploading || certificationDraft.proofImageName ? (
            <p className={`${isDark ? "mt-2 text-xs text-slate-400" : "mt-2 text-xs text-slate-500"} ${isCertificationUploading ? "animate-pulse" : ""}`}>
              {isCertificationUploading ? uploadingCertificationName : certificationDraft.proofImageName}
            </p>
          ) : null}
          {certificationDraft.proofImageThumbnailUrl ? (
            <button
              type="button"
              onClick={() =>
                onPreviewCertificationImageChange({
                  src: certificationDraft.proofImageUrl,
                  title: certificationDraft.proofImageName,
                })
              }
              className="mt-3 block"
            >
              <div className="w-full max-w-[360px] overflow-hidden rounded-[1rem] border border-slate-200 bg-slate-100 aspect-[4/3]">
                <Image
                  src={certificationDraft.proofImageThumbnailUrl}
                  alt={certificationDraft.proofImageName || "Certificado"}
                  width={320}
                  height={240}
                  unoptimized
                  className="h-full w-full object-contain"
                />
              </div>
            </button>
          ) : null}
        </div>
      </div>
    </PopupShell>
  );
}
