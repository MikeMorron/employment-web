"use client";

import {
  EMPTY_CERTIFICATION_DRAFT,
  EMPTY_EDUCATION_DRAFT,
  type CertificationDraft,
  type EducationDraft,
} from "@/components/profile/candidate-match-profile/constants";
import { CertificationPopup } from "@/components/profile/candidate-match-profile/certification-popup";
import { EducationPopup } from "@/components/profile/candidate-match-profile/education-popup";
import type {
  CertificationErrors,
  EducationErrors,
} from "@/components/profile/candidate-match-profile/popup-types";

export { CertificationPopup, EducationPopup };

export function resetEducationPopupState({
  onEducationErrorsChange,
  onEducationDraftChange,
  onEducationCareerQueryChange,
  onEducationFocusAreaQueryChange,
  onShowCareerOptionsChange,
  onShowFocusAreaOptionsChange,
  onShowEducationPopupChange,
}: {
  onEducationErrorsChange: React.Dispatch<React.SetStateAction<EducationErrors>>;
  onEducationDraftChange: React.Dispatch<React.SetStateAction<EducationDraft>>;
  onEducationCareerQueryChange: (value: string) => void;
  onEducationFocusAreaQueryChange: (value: string) => void;
  onShowCareerOptionsChange: (value: boolean) => void;
  onShowFocusAreaOptionsChange: (value: boolean) => void;
  onShowEducationPopupChange: (value: boolean) => void;
}) {
  onEducationErrorsChange({});
  onEducationDraftChange(EMPTY_EDUCATION_DRAFT);
  onEducationCareerQueryChange("");
  onEducationFocusAreaQueryChange("");
  onShowCareerOptionsChange(false);
  onShowFocusAreaOptionsChange(false);
  onShowEducationPopupChange(false);
}

export function resetCertificationPopupState({
  onCertificationErrorsChange,
  onIsCertificationUploadingChange,
  onUploadingCertificationNameChange,
  onCertificationDraftChange,
  onShowCertificationPopupChange,
}: {
  onCertificationErrorsChange: React.Dispatch<React.SetStateAction<CertificationErrors>>;
  onIsCertificationUploadingChange: (value: boolean) => void;
  onUploadingCertificationNameChange: (value: string) => void;
  onCertificationDraftChange: React.Dispatch<React.SetStateAction<CertificationDraft>>;
  onShowCertificationPopupChange: (value: boolean) => void;
}) {
  onCertificationErrorsChange({});
  onIsCertificationUploadingChange(false);
  onUploadingCertificationNameChange("");
  onCertificationDraftChange(EMPTY_CERTIFICATION_DRAFT);
  onShowCertificationPopupChange(false);
}
