import type {
  CertificationDraft,
  EducationDraft,
} from "@/components/profile/candidate-match-profile/constants";

export type ProfileUi = {
  input: string;
  buttonSecondary: string;
};

export type CertificationPreviewImage = {
  src: string;
  title: string;
} | null;

export type EducationErrors = Partial<Record<"educationType" | "institutionName" | "startDate" | "endDate" | "region" | "city", boolean>>;
export type CertificationErrors = Partial<Record<"issuer" | "certificationName" | "startedAt" | "completedAt" | "proofImageName", boolean>>;

export type EducationPopupProps = {
  isDark: boolean;
  profileUi: ProfileUi;
  showEducationPopup: boolean;
  educationDraft: EducationDraft;
  educationErrors: EducationErrors;
  educationCareerQuery: string;
  educationFocusAreaQuery: string;
  showCareerOptions: boolean;
  showFocusAreaOptions: boolean;
  locationDepartments: string[];
  educationCityOptions: string[];
  careerDropdownRef: React.RefObject<HTMLLabelElement | null>;
  focusAreaDropdownRef: React.RefObject<HTMLLabelElement | null>;
  onCancel: () => void;
  onConfirm: () => void;
  onEducationDraftChange: React.Dispatch<React.SetStateAction<EducationDraft>>;
  onEducationErrorsChange: React.Dispatch<React.SetStateAction<EducationErrors>>;
  onEducationCareerQueryChange: (value: string) => void;
  onEducationFocusAreaQueryChange: (value: string) => void;
  onShowCareerOptionsChange: (value: boolean) => void;
  onShowFocusAreaOptionsChange: (value: boolean) => void;
};

export type CertificationPopupProps = {
  isDark: boolean;
  profileUi: ProfileUi;
  showCertificationPopup: boolean;
  certificationDraft: CertificationDraft;
  certificationErrors: CertificationErrors;
  isCertificationUploading: boolean;
  uploadingCertificationName: string;
  certificationFileInputRef: React.RefObject<HTMLInputElement | null>;
  onCancel: () => void;
  onConfirm: () => void;
  onUploadCertificationImage: (file: File) => Promise<void>;
  onCertificationDraftChange: React.Dispatch<React.SetStateAction<CertificationDraft>>;
  onCertificationErrorsChange: React.Dispatch<React.SetStateAction<CertificationErrors>>;
  onPreviewCertificationImageChange: (value: CertificationPreviewImage) => void;
};
