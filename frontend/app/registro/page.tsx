"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Building2, Eye, EyeOff } from "lucide-react";
import { PasswordRequirements } from "@/app/registro/_components/password-requirements";
import { BackButton } from "@/components/ui/back-button";
import { useAppLanguage } from "@/hooks/use-app-language";
import { useVacancyTheme } from "@/hooks/use-vacancy-theme";
import { signInDemoAccount } from "@/lib/auth";
import { apiRequest } from "@/lib/api";
import { setClientAuthBundle } from "@/lib/client/request-auth";
import { isValidRegistrationPassword } from "@/lib/password-policy";
import { createLanguageProficiency, formatSalaryInputValue, sanitizeSalaryNumeric, WORK_MODALITY_OPTIONS } from "@/lib/profile-form";
import {
  colombiaDepartments,
  colombiaMunicipalities,
  vacancyCategoriesByLocale,
} from "@/data/colombia-locations";
import { SKILLS_CATALOG } from "@/data/skills-catalog";
import type { UserRole } from "@/types/account";
import type { AppUser, CandidateProfile, CompanyProfile } from "@/types/profile";

type RegistrationStep = 1 | 2 | 3 | 4;

type CredentialsState = {
  email: string;
  password: string;
};

type CandidateOnboarding = {
  firstName: string;
  lastName: string;
  birthDate: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  phoneCountry: "CO" | "US";
  phoneNumber: string;
  interestAreas: string[];
  selectedSkills: string[];
  department: string;
  city: string;
  experienceYears: string;
  expectedSalary: string;
  modality: string;
  employmentStatus: "actively_looking" | "open_to_opportunities" | "not_available";
};

type CompanyOnboarding = {
  companyName: string;
  industry: string;
  companySize: string;
  location: string;
  website: string;
  description: string;
  recruiterName: string;
  firstJobTitle: string;
};

const COMPANY_INDUSTRY_OPTIONS = [
  "Tecnología",
  "Servicios profesionales",
  "Logística y transporte",
  "Retail y comercio",
  "Salud",
  "Educación",
  "Marketing y publicidad",
];

const COMPANY_SIZE_OPTIONS = [
  "1-10 personas",
  "11-50 personas",
  "51-200 personas",
  "201-500 personas",
  "500+ personas",
];

const COMPANY_JOB_TEMPLATES = [
  "Asesor comercial",
  "Analista administrativo",
  "Diseñador gráfico",
  "Desarrollador frontend",
  "Auxiliar operativo",
];

function validateEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

function validateRealName(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return true;
  }

  if (normalized.length < 2) {
    return false;
  }

  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+(?:\s[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+)*$/.test(normalized)) {
    return false;
  }

  if (/([a-zA-ZáéíóúÁÉÍÓÚñÑüÜ])\1\1\1/i.test(normalized)) {
    return false;
  }

  const lowered = normalized.toLowerCase();
  if (["asdf", "qwer", "zxcv", "hjkl", "qwerty", "test", "prueba"].some((pattern) => lowered.includes(pattern))) {
    return false;
  }

  if (/[^aeiouáéíóúü\s]{5,}/i.test(normalized)) {
    return false;
  }

  const suspiciousBigrams = ["ao", "au", "ue", "uo", "oa", "oe", "ah", "eh", "oh", "jh", "hf", "hd", "fd", "df", "dc", "dq", "qf", "qj", "xq", "zx"];
  return normalized.split(/\s+/).every((word) => {
    if (word.length < 7) {
      return true;
    }

    const normalizedWord = normalizeSearchText(word);
    const hits = suspiciousBigrams.filter((bigram) => normalizedWord.includes(bigram)).length;
    return hits < 2;
  });
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getAreaSkillKeywords(area: string) {
  const normalized = normalizeSearchText(area);
  const tokens = normalized
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length >= 4)
    .filter((token) => !["ingeniero", "ingenieria", "desarrollador", "analista", "especialista", "arquitecto"].includes(token));

  if (normalized.includes("sistema")) {
    tokens.push("software", "programacion", "desarrollo", "arquitectura", "redes", "linux", "base", "datos");
  }

  if (normalized.includes("frontend")) tokens.push("react", "javascript", "typescript", "css", "web");
  if (normalized.includes("backend")) tokens.push("api", "node", "python", "java", "sql", "microservicios");
  if (normalized.includes("datos")) tokens.push("sql", "power", "python", "analytics", "etl", "bi");
  if (normalized.includes("seguridad")) tokens.push("seguridad", "ciber", "soc", "pentest", "forense");
  if (normalized.includes("diseno") || normalized.includes("ux")) tokens.push("figma", "ux", "ui", "prototipado", "research");

  return Array.from(new Set(tokens));
}

const REGISTRATION_WELCOME_MESSAGES = [
  "Bienvenido a TalentSyncro",
  "Estamos preparando todo para ti",
  "Encuentra ofertas centradas en tus áreas de interés",
  "Ajustamos tus primeras recomendaciones",
  "Organizamos tus habilidades para mejorar tus coincidencias",
  "Estamos conectando tu perfil con oportunidades reales",
  "Tu experiencia empieza con vacantes más relevantes",
  "Listamos señales para ayudarte a postular mejor",
  "Casi listo, estamos activando tu espacio",
  "Tus áreas de interés guiarán las primeras ofertas",
];

function pickWelcomeMessages() {
  return [...REGISTRATION_WELCOME_MESSAGES]
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);
}

function candidateIsAvailable(status: CandidateOnboarding["employmentStatus"]) {
  return status !== "not_available";
}

function mapEmploymentStatusToAvailability(status: CandidateOnboarding["employmentStatus"]) {
  if (status === "actively_looking") {
    return "available_now" as const;
  }

  if (status === "not_available") {
    return "not_available" as const;
  }

  return "interviewing" as const;
}

export default function RegistroPage() {
  const router = useRouter();
  const { isEnglish } = useAppLanguage();
  const { isDark, themeReady } = useVacancyTheme();
  const [step, setStep] = useState<RegistrationStep>(1);
  const [role, setRole] = useState<UserRole | null>(null);
  const [credentials, setCredentials] = useState<CredentialsState>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [candidateData, setCandidateData] = useState<CandidateOnboarding>({
    firstName: "",
    lastName: "",
    birthDate: "",
    birthDay: "",
    birthMonth: "",
    birthYear: "",
    phoneCountry: "CO",
    phoneNumber: "",
    interestAreas: [],
    selectedSkills: [],
    department: "",
    city: "",
    experienceYears: "1",
    expectedSalary: "",
    modality: WORK_MODALITY_OPTIONS[0],
    employmentStatus: "open_to_opportunities",
  });
  const [companyData, setCompanyData] = useState<CompanyOnboarding>({
    companyName: "",
    industry: COMPANY_INDUSTRY_OPTIONS[0],
    companySize: COMPANY_SIZE_OPTIONS[1],
    location: "Bogotá, Colombia",
    website: "https://tuempresa.com",
    description: "Describe qué hace tu empresa, qué tipo de talento busca y por qué vale la pena unirse al equipo.",
    recruiterName: "",
    firstJobTitle: COMPANY_JOB_TEMPLATES[0],
  });
  const [error, setError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [emailCheck, setEmailCheck] = useState<{
    email: string;
    status: "idle" | "checking" | "available" | "taken" | "error";
    message: string;
  }>({
    email: "",
    status: "idle",
    message: "",
  });
  const [welcomeMessages, setWelcomeMessages] = useState<string[]>(() => pickWelcomeMessages());
  const [professionQuery, setProfessionQuery] = useState("");
  const [interestAreaQuery, setInterestAreaQuery] = useState("");

  const candidateRoleOptions = useMemo(
    () => vacancyCategoriesByLocale[isEnglish ? "en" : "es"],
    [isEnglish],
  );
  const candidateInterestOptions = useMemo(
    () => candidateRoleOptions.filter((option) => option !== "Todas" && option !== "All").slice(0, 80),
    [candidateRoleOptions],
  );

  const labelClassName = isDark ? "mb-2 block text-sm font-medium text-slate-200" : "mb-2 block text-sm font-medium text-slate-700";
  const inputClassName = isDark
    ? "w-full rounded-[1.2rem] border border-white/10 bg-white/4 px-4 py-3 text-white outline-none transition focus:border-cyan-200/35"
    : "w-full rounded-[1.2rem] border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500";
  const secondaryButtonClassName = isDark
    ? "inline-flex w-full items-center justify-center rounded-[1.2rem] border border-white/10 bg-white/6 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10 sm:w-auto"
    : "inline-flex w-full items-center justify-center rounded-[1.2rem] border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto";
  const primaryButtonClassName = "inline-flex w-full items-center justify-center gap-2 rounded-[1.2rem] bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 sm:w-auto";
  const candidateDepartmentOptions = useMemo(
    () => colombiaDepartments.filter((item) => item !== "Todos"),
    [],
  );
  const candidateCityOptions = useMemo(() => {
    if (!candidateData.department) {
      return [];
    }

    return (colombiaMunicipalities[candidateData.department] ?? []).filter(
      (item) => item !== "Todos",
    );
  }, [candidateData.department]);
  const areaFilteredSkillOptions = useMemo(() => {
    const keywords = candidateData.interestAreas.flatMap(getAreaSkillKeywords);
    if (keywords.length === 0) {
      return [];
    }

    const query = normalizeSearchText(interestAreaQuery);
    return SKILLS_CATALOG.filter((skill) => {
      const normalizedSkill = normalizeSearchText(skill);
      return keywords.some((keyword) => normalizedSkill.includes(keyword)) &&
        (query ? normalizedSkill.includes(query) : true);
    }).slice(0, 36);
  }, [candidateData.interestAreas, interestAreaQuery]);
  const filteredProfessionOptions = useMemo(() => {
    const query = normalizeSearchText(professionQuery);
    return candidateInterestOptions
      .filter((option) => query ? normalizeSearchText(option).includes(query) : true)
      .slice(0, 40);
  }, [candidateInterestOptions, professionQuery]);
  const firstNameIsValid = validateRealName(candidateData.firstName);
  const lastNameIsValid = validateRealName(candidateData.lastName);

  const validateEmailAvailability = useCallback(async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!validateEmail(normalizedEmail)) {
      setEmailCheck({ email: normalizedEmail, status: "idle", message: "" });
      return false;
    }

    setEmailCheck({
      email: normalizedEmail,
      status: "checking",
      message: isEnglish ? "Checking email..." : "Validando correo...",
    });

    const response = await apiRequest<{ ok: boolean; exists?: boolean; message?: string }>(
      `/api/auth/register?email=${encodeURIComponent(normalizedEmail)}`,
    );

    if (!response.ok) {
      const message = response.data?.message ?? (isEnglish ? "Unable to validate email." : "No se pudo validar el correo.");
      setEmailCheck({ email: normalizedEmail, status: "error", message });
      return false;
    }

    if (response.data?.exists) {
      const message = isEnglish ? "This email is already registered." : "Este correo ya está registrado.";
      setEmailCheck({ email: normalizedEmail, status: "taken", message });
      setError(message);
      return false;
    }

    setEmailCheck({
      email: normalizedEmail,
      status: "available",
      message: isEnglish ? "Email available." : "Correo disponible.",
    });
    return true;
  }, [isEnglish]);

  useEffect(() => {
    if (step !== 2) {
      return;
    }

    const normalizedEmail = credentials.email.trim().toLowerCase();
    if (!validateEmail(normalizedEmail)) {
      return;
    }

    const timer = window.setTimeout(() => {
      void validateEmailAvailability(normalizedEmail);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [credentials.email, step, validateEmailAvailability]);

  const buildRegisteredUser = (): AppUser | null => {
    if (!role) {
      return null;
    }

    if (role === "candidate") {
      const displayName = `${candidateData.firstName} ${candidateData.lastName}`.trim();
      const phoneDigits = candidateData.phoneNumber.replace(/\D/g, "").slice(0, 10);
      const phonePrefix = candidateData.phoneCountry === "US" ? "+1" : "+57";
      const phoneDisplay = phoneDigits.replace(
        /^(\d{0,3})(\d{0,3})(\d{0,4}).*$/,
        (_match, first: string, second: string, third: string) =>
          [first, second, third].filter(Boolean).join(" "),
      );
      const locationLabel =
        candidateData.city && candidateData.department
          ? `${candidateData.city}, ${candidateData.department}`
          : "";
      const user: CandidateProfile = {
        id: `candidate-${Date.now()}`,
        role: "candidate",
        plan: "basic",
        displayName,
        nombre: displayName,
        rol: candidateData.interestAreas[0] ?? "",
        ubicacion: locationLabel,
        email: credentials.email.trim().toLowerCase(),
        birthDate: candidateData.birthDate,
        birthPlace: "",
        tipoRegistro: "persona",
        modalidadTrabajo: candidateData.modality,
        expectativaSalarial: candidateData.expectedSalary,
        expectativaSalarialMin: candidateData.expectedSalary,
        expectativaSalarialMax: candidateData.expectedSalary,
        jornada: "Tiempo completo",
        telefono: phoneDigits ? `${phonePrefix} ${phoneDisplay}` : "",
        website: "",
        avatar: "",
        avatarStoredFileName: "",
        cvStoredFileName: "",
        idiomas: [createLanguageProficiency("Español", "Nativo")],
        disponibilidadViaje:
          candidateData.employmentStatus === "actively_looking"
            ? "Buscando empleo activamente"
            : candidateData.employmentStatus === "open_to_opportunities"
              ? "Abierto a oportunidades"
              : "No disponible actualmente",
        movilidad: "",
        skills: candidateData.selectedSkills,
        experiencia: candidateData.experienceYears
          ? [
              {
                rol: candidateData.interestAreas[0] ?? "Experiencia laboral",
                empresa: "Experiencia general",
                tiempo: `${candidateData.experienceYears} años`,
                actualidad: candidateIsAvailable(candidateData.employmentStatus),
                durationMonths: Number(candidateData.experienceYears) * 12,
              },
            ]
          : [],
        professionalProfile: {
          currentJobTitle: candidateData.interestAreas[0],
          preferredRoleTitles: candidateData.interestAreas,
          availabilityStatus: mapEmploymentStatusToAvailability(candidateData.employmentStatus),
        },
        workPreferences: {
          preferredWorkModes: [candidateData.modality],
          preferredLocations: locationLabel ? [locationLabel] : [],
          preferredEmploymentTypes: [],
        },
        categoriasEnfoque: candidateData.interestAreas,
      };

      return user;
    }

    const companyUser: CompanyProfile = {
      id: `company-${Date.now()}`,
      role: "company",
      plan: "basic",
      displayName: companyData.companyName,
      nombre: companyData.companyName,
      rol: "Employer Admin",
      email: credentials.email.trim().toLowerCase(),
      tipoRegistro: "empresa",
      ubicacion: companyData.location,
      telefono: "",
      website: companyData.website,
      avatar: "",
      avatarStoredFileName: "",
      companyName: companyData.companyName,
      industry: companyData.industry,
      companySize: companyData.companySize,
      companyDescription: companyData.description,
      companyWebsite: companyData.website,
      companyLocation: companyData.location,
      activeJobs: companyData.firstJobTitle.trim() ? 1 : 0,
      verificationStatus: "pending",
      analyticsSummary: {
        profileViews: 0,
        applications: 0,
        conversionRate: 0,
      },
      hiringFocus: companyData.firstJobTitle.trim() ? [companyData.firstJobTitle.trim()] : [],
    };

    return companyUser;
  };

  const stepTitle = useMemo(() => {
    if (step === 1) {
      return isEnglish ? "What do you want to do?" : "¿Qué quieres hacer?";
    }

    if (step === 2) {
      return isEnglish ? "Create your account" : "Crea tu cuenta";
    }

    if (step === 3) {
      return role === "company"
        ? isEnglish
          ? "Set up your company account"
          : "Configura tu cuenta empresa"
        : isEnglish
          ? "Complete your candidate profile"
          : "Completa tu perfil candidato";
    }

    if (step === 4 && role === "candidate" && !registrationComplete) {
      return isEnglish ? "Set your work preferences" : "Configura tus preferencias laborales";
    }

    return isEnglish ? "Registration ready" : "Registro listo";
  }, [isEnglish, registrationComplete, role, step]);

  const handleCredentialsNext = async () => {
    if (!validateEmail(credentials.email)) {
      setError(
        isEnglish
          ? "Use a valid email address."
          : "Usa un correo electrónico válido.",
      );
      return;
    }

    if (!isValidRegistrationPassword(credentials.password)) {
      setError(
        isEnglish
          ? "Use at least 10 characters, 1 number, and 1 allowed special character without spaces."
          : "Usa mínimo 10 caracteres, 1 número y 1 caracter especial permitido, sin espacios.",
      );
      return;
    }

    const normalizedEmail = credentials.email.trim().toLowerCase();
    const emailIsAvailable =
      emailCheck.email === normalizedEmail && emailCheck.status === "available"
        ? true
        : await validateEmailAvailability(normalizedEmail);

    if (!emailIsAvailable) {
      return;
    }

    setError("");
    setStep(3);
  };

  const handleRoleNext = () => {
    if (!role) {
          setError(isEnglish ? "Select one path to continue." : "Selecciona una opción para continuar.");
      return;
    }

    setError("");
    setStep(2);
  };

  const handleCandidateDetailsNext = () => {
    if (
      !candidateData.firstName.trim() ||
      !candidateData.lastName.trim() ||
      !candidateData.birthDate.trim() ||
      !candidateData.department.trim() ||
      !candidateData.city.trim() ||
      candidateData.interestAreas.length < 1
    ) {
      setError(
        isEnglish
          ? "Complete the required candidate fields."
          : "Completa los campos requeridos del candidato.",
      );
      return;
    }

    if (!firstNameIsValid || !lastNameIsValid) {
      setError(isEnglish ? "Use a real name to continue." : "Ingresa un nombre real para continuar.");
      return;
    }

    const birthTime = new Date(candidateData.birthDate).getTime();
    const minBirthTime = new Date();
    minBirthTime.setFullYear(minBirthTime.getFullYear() - 15);
    const maxBirthTime = new Date();
    maxBirthTime.setFullYear(maxBirthTime.getFullYear() - 70);
    if (!Number.isFinite(birthTime) || birthTime > minBirthTime.getTime()) {
      setError(
        isEnglish
          ? "You must be at least 15 years old to register."
          : "Debes tener mínimo 15 años para registrarte.",
      );
      return;
    }
    if (birthTime < maxBirthTime.getTime()) {
      setError(
        isEnglish
          ? "You must be 70 years old or younger to register."
          : "Debes tener máximo 70 años para registrarte.",
      );
      return;
    }

    setError("");
    setStep(4);
  };

  const handleSubmit = async () => {
    if (!role) {
      setError(isEnglish ? "Missing role selection." : "Falta seleccionar un rol.");
      return;
    }

    if (role === "candidate") {
      if (
        !candidateData.firstName.trim() ||
        !candidateData.lastName.trim() ||
        !candidateData.birthDate.trim() ||
        candidateData.interestAreas.length < 1 ||
        candidateData.selectedSkills.length < 1 ||
        !candidateData.department.trim() ||
        !candidateData.city.trim() ||
        !candidateData.expectedSalary.trim()
      ) {
        setError(
          isEnglish
            ? "Complete the required candidate fields."
            : "Completa los campos requeridos del candidato.",
        );
        return;
      }

      const birthTime = new Date(candidateData.birthDate).getTime();
      const minBirthTime = new Date();
      minBirthTime.setFullYear(minBirthTime.getFullYear() - 15);
      const maxBirthTime = new Date();
      maxBirthTime.setFullYear(maxBirthTime.getFullYear() - 70);
      if (!Number.isFinite(birthTime) || birthTime > minBirthTime.getTime()) {
        setError(
          isEnglish
            ? "You must be at least 15 years old to register."
            : "Debes tener mínimo 15 años para registrarte.",
        );
        return;
      }
      if (birthTime < maxBirthTime.getTime()) {
        setError(
          isEnglish
            ? "You must be 70 years old or younger to register."
            : "Debes tener máximo 70 años para registrarte.",
        );
        return;
      }
    }

    if (role === "company") {
      if (
        !companyData.companyName.trim() ||
        !companyData.industry.trim() ||
        !companyData.companySize.trim() ||
        !companyData.location.trim() ||
        !companyData.recruiterName.trim()
      ) {
        setError(
          isEnglish
            ? "Complete the required company fields."
            : "Completa los campos requeridos de la empresa.",
        );
        return;
      }
    }

    const registeredUser = buildRegisteredUser();

    if (!registeredUser) {
      setError(isEnglish ? "Unable to create local account." : "No se pudo crear la cuenta local.");
      return;
    }

    const result = await apiRequest<{
      ok: boolean;
      user: AppUser | null;
      auth?: {
        accessToken: string;
        accessTokenExpiresAt: string;
        csrfToken: string;
        requestSigningKey: string;
        requestSigningKeyExpiresAt: string;
        sessionCheckExpiresAt: string;
      } | null;
      message?: string;
    }>(
      "/api/auth/register",
      {
        method: "POST",
        body: JSON.stringify({
          email: credentials.email.trim().toLowerCase(),
          password: credentials.password,
          user: registeredUser,
        }),
      },
    );

    if (!result.ok || !result.data?.user) {
      setError(result.data?.message ?? (isEnglish ? "Unable to create account." : "No se pudo crear la cuenta."));
      return;
    }

    setClientAuthBundle(result.data.auth ?? null);
    signInDemoAccount(result.data.user);
    setError("");
    setWelcomeMessages(pickWelcomeMessages());
    setSubmitMessage(
      role === "company"
        ? isEnglish
          ? "Company account created successfully."
          : "La cuenta empresa se creó correctamente."
        : isEnglish
          ? "Candidate account created successfully."
          : "La cuenta de candidato se creó correctamente.",
    );
    setRegistrationComplete(true);
    setStep(4);
    window.setTimeout(() => {
      router.push(role === "candidate" ? "/matches" : "/candidatos");
    }, 10000);
  };

  const formattedExpectedSalary = formatSalaryInputValue(candidateData.expectedSalary);
  const currentYear = new Date().getFullYear();
  const birthDayOptions = Array.from({ length: 31 }, (_, index) => String(index + 1).padStart(2, "0"));
  const birthMonthOptions = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
  const birthYearOptions = Array.from({ length: 71 }, (_, index) => String(currentYear - index));
  const setCandidateBirthPart = (part: "birthDay" | "birthMonth" | "birthYear", value: string) => {
    setCandidateData((current) => {
      const next = { ...current, [part]: value };
      const birthDate =
        next.birthYear && next.birthMonth && next.birthDay
          ? `${next.birthYear}-${next.birthMonth}-${next.birthDay}`
          : "";

      return { ...next, birthDate };
    });
  };

  return (
    <main className={`min-h-screen px-4 py-8 ${isDark ? "vacancies-shell text-[#eef6ff]" : "vacancies-shell-light text-slate-950"} ${themeReady ? "" : "invisible"} sm:px-6`}>
      <div className="mx-auto max-w-5xl">
        <BackButton
          fallbackHref="/"
          className={isDark ? "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10" : "inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"}
        >
          <ArrowLeft className="h-4 w-4" />
          {isEnglish ? "Back" : "Volver"}
        </BackButton>

        <section className={isDark ? "mt-6 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,16,31,0.96),rgba(8,17,32,0.92))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.34)] sm:p-8" : "mt-6 rounded-[2rem] border border-slate-300 bg-white/92 p-6 shadow-[0_24px_70px_rgba(148,163,184,0.16)] sm:p-8"}>
          <div className="max-w-3xl">
            <p className={isDark ? "text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200" : "text-sm font-semibold uppercase tracking-[0.24em] text-sky-700"}>
              {isEnglish ? `Step ${step} of 4` : `Paso ${step} de 4`}
            </p>
            <h1 className={isDark ? "mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl" : "mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl"}>
              {stepTitle}
            </h1>
          </div>

          {step === 2 ? (
            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,0.85fr)]">
              <div className="space-y-5">
                <div>
                  <label className={labelClassName}>
                    {isEnglish ? "Email" : "Correo"}
                  </label>
                  <input
                    type="email"
                    value={credentials.email}
                    onChange={(event) => {
                      const nextEmail = event.target.value;
                      setCredentials((current) => ({ ...current, email: nextEmail }));
                      if (!validateEmail(nextEmail)) {
                        setEmailCheck({
                          email: nextEmail.trim().toLowerCase(),
                          status: "idle",
                          message: "",
                        });
                      }
                    }}
                    className={inputClassName}
                  />
                  {emailCheck.message && emailCheck.email === credentials.email.trim().toLowerCase() ? (
                    <p
                      className={
                        emailCheck.status === "available"
                          ? isDark
                            ? "mt-2 text-xs font-medium text-emerald-200"
                            : "mt-2 text-xs font-medium text-emerald-700"
                          : emailCheck.status === "checking"
                            ? isDark
                              ? "mt-2 text-xs font-medium text-slate-300"
                              : "mt-2 text-xs font-medium text-slate-600"
                            : isDark
                              ? "mt-2 text-xs font-medium text-rose-200"
                              : "mt-2 text-xs font-medium text-rose-700"
                      }
                    >
                      {emailCheck.message}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className={labelClassName}>
                    {isEnglish ? "Password" : "Contraseña"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={credentials.password}
                      onChange={(event) =>
                        setCredentials((current) => ({ ...current, password: event.target.value }))
                      }
                      className={`${inputClassName} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? (isEnglish ? "Hide password" : "Ocultar contraseña") : (isEnglish ? "Show password" : "Mostrar contraseña")}
                      className={isDark ? "absolute right-4 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-slate-400 transition hover:text-slate-200" : "absolute right-4 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-slate-500 transition hover:text-slate-700"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <PasswordRequirements isEnglish={isEnglish} isDark={isDark} password={credentials.password} />
                </div>

                <button
                  type="button"
                  onClick={handleCredentialsNext}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[1.2rem] bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
                >
                  {isEnglish ? "Continue" : "Continuar"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className={isDark ? "rounded-[1.8rem] border border-cyan-300/12 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(8,17,32,0.92),rgba(13,99,255,0.08))] p-6" : "rounded-[1.8rem] border border-slate-200 bg-[linear-gradient(135deg,rgba(252,209,22,0.08),rgba(255,255,255,0.96),rgba(0,56,147,0.05))] p-6"}>
                <p className={isDark ? "text-sm leading-7 text-slate-300" : "text-sm leading-7 text-slate-700"}>
                  {isEnglish
                    ? "Registration starts with authentication only. After this step we ask your intent and open the onboarding flow that matches your role."
                    : "El registro comienza solo con autenticación. Después de este paso te preguntamos tu intención y abrimos la incorporación que corresponde a tu rol."}
                </p>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setRole("candidate");
                  setError("");
                }}
                className={`rounded-[1.8rem] border p-6 text-left transition ${
                  role === "candidate"
                    ? isDark
                      ? "border-cyan-300/28 bg-cyan-300/10 shadow-[0_18px_44px_rgba(34,211,238,0.12)]"
                      : "border-sky-400 bg-sky-50 shadow-[0_18px_44px_rgba(56,189,248,0.12)]"
                    : isDark
                      ? "border-white/10 bg-white/4 hover:border-cyan-200/24"
                      : "border-slate-300 bg-white hover:border-slate-400"
                }`}
              >
                <BriefcaseBusiness className="h-7 w-7 text-sky-700" />
                <h2 className={isDark ? "mt-4 text-2xl font-semibold text-white" : "mt-4 text-2xl font-semibold text-slate-950"}>
                  {isEnglish ? "Find work" : "Buscar empleo"}
                </h2>
                <p className={isDark ? "mt-3 text-sm leading-7 text-slate-300" : "mt-3 text-sm leading-7 text-slate-700"}>
                  {isEnglish
                    ? "Create a candidate account, complete your profile, upload your CV, and start applying faster."
                    : "Crea una cuenta de candidato, completa tu perfil, sube tu CV y empieza a postularte más rápido."}
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole("company");
                  setError("");
                }}
                className={`rounded-[1.8rem] border p-6 text-left transition ${
                  role === "company"
                    ? isDark
                      ? "border-amber-300/28 bg-amber-400/10 shadow-[0_18px_44px_rgba(245,158,11,0.10)]"
                      : "border-amber-400 bg-amber-50 shadow-[0_18px_44px_rgba(245,158,11,0.12)]"
                    : isDark
                      ? "border-white/10 bg-white/4 hover:border-cyan-200/24"
                      : "border-slate-300 bg-white hover:border-slate-400"
                }`}
              >
                <Building2 className="h-7 w-7 text-amber-700" />
                <h2 className={isDark ? "mt-4 text-2xl font-semibold text-white" : "mt-4 text-2xl font-semibold text-slate-950"}>
                  {isEnglish ? "Find talent" : "Buscar talento"}
                </h2>
                <p className={isDark ? "mt-3 text-sm leading-7 text-slate-300" : "mt-3 text-sm leading-7 text-slate-700"}>
                  {isEnglish
                    ? "Create a company account, configure your hiring profile, and publish your first openings."
                    : "Crea una cuenta de empresa, configura tu perfil de contratación y publica tus primeras vacantes."}
                </p>
              </button>

              <div className="lg:col-span-2 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className={secondaryButtonClassName}
                >
                  {isEnglish ? "Back" : "Atrás"}
                </button>
                <button
                  type="button"
                  onClick={handleRoleNext}
                  className={primaryButtonClassName}
                >
                  {isEnglish ? "Continue" : "Continuar"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}

          {step === 3 && role === "candidate" ? (
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <div>
                <label className={labelClassName}>
                  {isEnglish ? "First name" : "Nombre"}
                </label>
                <input
                  value={candidateData.firstName}
                  onChange={(event) =>
                    setCandidateData((current) => ({
                      ...current,
                      firstName: event.target.value,
                    }))
                  }
                  className={inputClassName}
                />
                {!firstNameIsValid ? (
                  <p className={isDark ? "mt-2 text-xs font-medium text-rose-200" : "mt-2 text-xs font-medium text-rose-700"}>
                    {isEnglish ? "First name is not valid." : "El nombre no es válido."}
                  </p>
                ) : null}
              </div>

              <div>
                <label className={labelClassName}>
                  {isEnglish ? "Last name" : "Apellidos"}
                </label>
                <input
                  value={candidateData.lastName}
                  onChange={(event) =>
                    setCandidateData((current) => ({
                      ...current,
                      lastName: event.target.value,
                    }))
                  }
                  className={inputClassName}
                />
                {!lastNameIsValid ? (
                  <p className={isDark ? "mt-2 text-xs font-medium text-rose-200" : "mt-2 text-xs font-medium text-rose-700"}>
                    {isEnglish ? "Last name is not valid." : "El apellido no es válido."}
                  </p>
                ) : null}
              </div>

              <div className="lg:col-span-2 grid gap-4 lg:grid-cols-2">
                <div>
                  <label className={labelClassName}>
                    {isEnglish ? "Birth date" : "Fecha de nacimiento"}
                  </label>
                  <div className={isDark ? "grid grid-cols-3 gap-2 rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-2" : "grid grid-cols-3 gap-2 rounded-[1.25rem] border border-slate-300 bg-slate-50 p-2"}>
                    <select
                      value={candidateData.birthDay}
                      onChange={(event) => setCandidateBirthPart("birthDay", event.target.value)}
                      className={`${inputClassName} rounded-[0.9rem] px-3 py-2.5 text-sm`}
                    >
                      <option value="">{isEnglish ? "Day" : "Día"}</option>
                      {birthDayOptions.map((day) => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    <select
                      value={candidateData.birthMonth}
                      onChange={(event) => setCandidateBirthPart("birthMonth", event.target.value)}
                      className={`${inputClassName} rounded-[0.9rem] px-3 py-2.5 text-sm`}
                    >
                      <option value="">{isEnglish ? "Month" : "Mes"}</option>
                      {birthMonthOptions.map((month) => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                    <select
                      value={candidateData.birthYear}
                      onChange={(event) => setCandidateBirthPart("birthYear", event.target.value)}
                      className={`${inputClassName} rounded-[0.9rem] px-3 py-2.5 text-sm`}
                    >
                      <option value="">{isEnglish ? "Year" : "Año"}</option>
                      {birthYearOptions.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClassName}>
                    {isEnglish ? "Phone" : "Teléfono"}
                  </label>
                  <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2">
                    <select
                      value={candidateData.phoneCountry}
                      onChange={(event) =>
                        setCandidateData((current) => ({
                          ...current,
                          phoneCountry: event.target.value === "US" ? "US" : "CO",
                        }))
                      }
                      className={`${inputClassName} px-3 py-2.5 text-sm`}
                    >
                      <option value="CO">🇨🇴 +57</option>
                      <option value="US">🇺🇸 +1</option>
                    </select>
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      value={candidateData.phoneNumber.replace(/\D/g, "").slice(0, 10)}
                      onChange={(event) =>
                        setCandidateData((current) => ({
                          ...current,
                          phoneNumber: event.target.value.replace(/\D/g, "").slice(0, 10),
                        }))
                      }
                      placeholder={isEnglish ? "000 000 0000 (optional)" : "000 000 0000 (opcional)"}
                      className={`${inputClassName} px-3 py-2.5 text-sm`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClassName}>
                  {isEnglish ? "Department" : "Departamento"}
                </label>
                <select
                  value={candidateData.department}
                  onChange={(event) =>
                    setCandidateData((current) => ({
                      ...current,
                      department: event.target.value,
                      city: "",
                    }))
                  }
                  className={inputClassName}
                >
                  <option value="">{isEnglish ? "Select one" : "Selecciona una opción"}</option>
                  {candidateDepartmentOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClassName}>
                  {isEnglish ? "City" : "Ciudad"}
                </label>
                <select
                  value={candidateData.city}
                  onChange={(event) =>
                    setCandidateData((current) => ({
                      ...current,
                      city: event.target.value,
                    }))
                  }
                  disabled={!candidateData.department}
                  className={`${inputClassName} disabled:bg-slate-100 disabled:text-slate-400`}
                >
                  <option value="">{isEnglish ? "Select one" : "Selecciona una opción"}</option>
                  {candidateCityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-1">
                <label className={labelClassName}>
                  {isEnglish ? "Profession" : "Profesión"}
                </label>
                <input
                  value={professionQuery}
                  onChange={(event) => setProfessionQuery(event.target.value)}
                  placeholder={candidateData.interestAreas[0] ?? (isEnglish ? "Search and select one" : "Buscar y seleccionar una")}
                  className={`${inputClassName} py-2.5 text-sm`}
                />
                <div className={isDark ? "mt-2 max-h-36 overflow-y-auto rounded-[1rem] border border-white/10 bg-white/4 p-2" : "mt-2 max-h-36 overflow-y-auto rounded-[1rem] border border-slate-300 bg-white p-2"}>
                  {filteredProfessionOptions.map((option) => {
                    const selected = candidateData.interestAreas[0] === option;

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setProfessionQuery("");
                          setInterestAreaQuery("");
                          setCandidateData((current) => ({
                            ...current,
                            interestAreas: [option],
                            selectedSkills: [],
                          }));
                        }}
                        className={
                          selected
                            ? "w-full rounded-[0.85rem] bg-slate-900 px-3 py-2 text-left text-xs font-semibold text-white"
                            : isDark
                              ? "w-full rounded-[0.85rem] px-3 py-2 text-left text-xs font-medium text-slate-200 transition hover:bg-white/8"
                              : "w-full rounded-[0.85rem] px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                        }
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : null}

          {step === 3 && role === "company" ? (
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <div className={isDark ? "lg:col-span-2 rounded-[1.4rem] border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-7 text-amber-50" : "lg:col-span-2 rounded-[1.4rem] border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-slate-700"}>
                {isEnglish
                  ? "Use these suggested values as a starting point. You can edit everything, but this keeps the company onboarding from feeling empty."
                  : "Usa estos valores sugeridos como punto de partida. Puedes editarlo todo, pero así la incorporación de la empresa no se siente vacía."}
              </div>

              <div>
                <label className={labelClassName}>{isEnglish ? "Company name" : "Nombre de la empresa"}</label>
                <input
                  value={companyData.companyName}
                  onChange={(event) =>
                    setCompanyData((current) => ({
                      ...current,
                      companyName: event.target.value,
                    }))
                  }
                  placeholder={isEnglish ? "Example: Brújula Digital SAS" : "Ejemplo: Brújula Digital SAS"}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>{isEnglish ? "Industry" : "Industria"}</label>
                <select
                  value={companyData.industry}
                  onChange={(event) =>
                    setCompanyData((current) => ({
                      ...current,
                      industry: event.target.value,
                    }))
                  }
                  className={inputClassName}
                >
                  {COMPANY_INDUSTRY_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClassName}>{isEnglish ? "Company size" : "Tamaño"}</label>
                <select
                  value={companyData.companySize}
                  onChange={(event) =>
                    setCompanyData((current) => ({
                      ...current,
                      companySize: event.target.value,
                    }))
                  }
                  className={inputClassName}
                >
                  {COMPANY_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClassName}>{isEnglish ? "Location" : "Ubicación"}</label>
                <input
                  value={companyData.location}
                  onChange={(event) =>
                    setCompanyData((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>{isEnglish ? "Website" : "Sitio web"}</label>
                <input
                  value={companyData.website}
                  onChange={(event) =>
                    setCompanyData((current) => ({
                      ...current,
                      website: event.target.value,
                    }))
                  }
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>{isEnglish ? "Primary recruiter" : "Recruiter principal"}</label>
                <input
                  value={companyData.recruiterName}
                  onChange={(event) =>
                    setCompanyData((current) => ({
                      ...current,
                      recruiterName: event.target.value,
                    }))
                  }
                  placeholder={isEnglish ? "Example: Camila Torres" : "Ejemplo: Camila Torres"}
                  className={inputClassName}
                />
              </div>

              <div className="lg:col-span-2">
                <label className={labelClassName}>{isEnglish ? "First opening (optional)" : "Primera vacante (opcional)"}</label>
                <div className="mb-3 flex flex-wrap gap-2">
                  {COMPANY_JOB_TEMPLATES.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() =>
                        setCompanyData((current) => ({
                          ...current,
                          firstJobTitle: option,
                        }))
                      }
                      className={isDark ? "rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-200/24 hover:bg-white/8" : "rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <input
                  value={companyData.firstJobTitle}
                  onChange={(event) =>
                    setCompanyData((current) => ({
                      ...current,
                      firstJobTitle: event.target.value,
                    }))
                  }
                  className={inputClassName}
                />
              </div>
              <div className="lg:col-span-2">
                <label className={labelClassName}>
                  {isEnglish ? "Company description" : "Descripción de la empresa"}
                </label>
                <textarea
                  rows={5}
                  value={companyData.description}
                  onChange={(event) =>
                    setCompanyData((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className={inputClassName}
                />
              </div>
            </div>
          ) : null}

          {step === 4 && role === "candidate" && !registrationComplete ? (
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <div>
                <label className={labelClassName}>
                  {isEnglish ? "Related skills" : "Habilidades relacionadas"}
                </label>
                <input
                  value={interestAreaQuery}
                  onChange={(event) => setInterestAreaQuery(event.target.value)}
                  placeholder={isEnglish ? "Search related areas" : "Buscar áreas relacionadas"}
                  className={inputClassName}
                />
                <div className={isDark ? "mt-2 max-h-48 overflow-y-auto rounded-[1rem] border border-white/10 bg-white/4 p-2" : "mt-2 max-h-48 overflow-y-auto rounded-[1rem] border border-slate-300 bg-white p-2"}>
                  {areaFilteredSkillOptions.length > 0 ? areaFilteredSkillOptions.map((skill) => {
                    const selected = candidateData.selectedSkills.includes(skill);

                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() =>
                          setCandidateData((current) => ({
                            ...current,
                            selectedSkills: current.selectedSkills.includes(skill)
                              ? current.selectedSkills.filter((item) => item !== skill)
                              : [...current.selectedSkills, skill].slice(0, 5),
                          }))
                        }
                        className={
                          selected
                            ? "w-full rounded-[0.85rem] bg-sky-700 px-3 py-2 text-left text-xs font-semibold text-white"
                            : isDark
                              ? "w-full rounded-[0.85rem] px-3 py-2 text-left text-xs font-medium text-slate-200 transition hover:bg-white/8"
                              : "w-full rounded-[0.85rem] px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                        }
                      >
                        {skill}
                      </button>
                    );
                  }) : (
                    <p className={isDark ? "px-3 py-2 text-sm text-slate-300" : "px-3 py-2 text-sm text-slate-600"}>
                      {isEnglish ? "Select a profession first." : "Selecciona una profesión primero."}
                    </p>
                  )}
                </div>
                {candidateData.selectedSkills.length > 0 ? (
                  <p className={isDark ? "mt-2 text-xs text-slate-300" : "mt-2 text-xs text-slate-600"}>
                    {candidateData.selectedSkills.length}/5
                  </p>
                ) : null}
              </div>

              <div>
                <label className={labelClassName}>
                  {isEnglish ? "Expected salary" : "Salario esperado"}
                </label>
                <input
                  inputMode="numeric"
                  value={formattedExpectedSalary}
                  onChange={(event) =>
                    setCandidateData((current) => ({
                      ...current,
                      expectedSalary: sanitizeSalaryNumeric(event.target.value),
                    }))
                  }
                  placeholder="$4.000.000"
                  className={inputClassName}
                />
              </div>

              <div className="grid gap-3 lg:grid-cols-2 lg:items-end">
                <div>
                  <label className={labelClassName}>
                    {isEnglish ? "Work modality" : "Modalidad"}
                  </label>
                  <select
                    value={candidateData.modality}
                    onChange={(event) =>
                      setCandidateData((current) => ({
                        ...current,
                        modality: event.target.value,
                      }))
                    }
                    className={`${inputClassName} px-3 py-2.5 text-sm`}
                  >
                    {WORK_MODALITY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClassName}>
                    {isEnglish ? "Employment status" : "Estado laboral"}
                  </label>
                  <select
                    value={candidateData.employmentStatus}
                    onChange={(event) =>
                      setCandidateData((current) => ({
                        ...current,
                        employmentStatus: event.target.value as CandidateOnboarding["employmentStatus"],
                      }))
                    }
                    className={`${inputClassName} px-3 py-2.5 text-sm`}
                  >
                    <option value="actively_looking">{isEnglish ? "Actively looking" : "Buscando empleo activamente"}</option>
                    <option value="open_to_opportunities">{isEnglish ? "Open to opportunities" : "Abierto a oportunidades"}</option>
                    <option value="not_available">{isEnglish ? "Not available now" : "No disponible actualmente"}</option>
                  </select>
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className={labelClassName}>
                  {isEnglish ? "Work experience" : "Experiencia laboral"}
                </label>
                <div className={isDark ? "inline-flex h-[42px] items-center gap-2 rounded-[1rem] border border-white/10 bg-white/4 px-3 text-sm font-medium text-slate-200" : "inline-flex h-[42px] items-center gap-2 rounded-[1rem] border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700"}>
                  <span className="whitespace-nowrap">{isEnglish ? "Experience:" : "Experiencia:"}</span>
                  <select
                    value={candidateData.experienceYears}
                    onChange={(event) =>
                      setCandidateData((current) => ({
                        ...current,
                        experienceYears: event.target.value,
                      }))
                    }
                    className={isDark ? "rounded-lg border border-white/10 bg-[#081120] px-2 py-1 text-white" : "rounded-lg border border-slate-300 bg-white px-2 py-1 text-slate-900"}
                  >
                    {Array.from({ length: 10 }, (_, index) => String(index + 1)).map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <span>{isEnglish ? "Years" : "Años"}</span>
                </div>
              </div>
            </div>
          ) : null}

          {step === 4 && registrationComplete ? (
            <div className={isDark ? "mt-8 overflow-hidden rounded-[1.8rem] border border-emerald-300/20 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16)_0%,rgba(8,17,32,0.96)_46%,rgba(6,12,24,0.98)_100%)] p-6" : "mt-8 overflow-hidden rounded-[1.8rem] border border-emerald-200 bg-[radial-gradient(circle_at_top,#ecfeff_0%,#effcf5_46%,#ecfdf5_100%)] p-6"}>
              <div className="mx-auto max-w-2xl text-center">
                <div className="welcome-flag">
                  <video
                    className="welcome-flag__video"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                  >
                    <source src="/bandera.mp4" type="video/mp4" />
                  </video>
                </div>
	                <p className={isDark ? "mt-6 text-sm leading-7 text-emerald-100" : "mt-6 text-sm leading-7 text-emerald-900"}>{submitMessage}</p>
                <div className="mt-4 space-y-2">
                  {welcomeMessages.map((message) => (
                    <p key={message} className={isDark ? "text-sm text-emerald-100/90" : "text-sm text-emerald-800"}>
                      {message}
                    </p>
                  ))}
                </div>
                <p className={isDark ? "mt-2 text-xs font-medium uppercase tracking-[0.18em] text-emerald-200" : "mt-2 text-xs font-medium uppercase tracking-[0.18em] text-emerald-700"}>
                  {role === "candidate"
                    ? isEnglish
                      ? "Redirecting to your matches"
                      : "Redirigiendo a tus coincidencias"
                    : isEnglish
                      ? "Redirecting to candidates"
                      : "Redirigiendo a candidatos"}
                </p>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className={isDark ? "mt-6 rounded-[1.2rem] border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100" : "mt-6 rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"}>
              {error}
            </div>
          ) : null}

          {(step === 3 || (step === 4 && role === "candidate" && !registrationComplete)) ? (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setStep(step === 4 ? 3 : 2)}
                className={secondaryButtonClassName}
              >
	                  {isEnglish ? "Back" : "Atrás"}
              </button>
              <button
                type="button"
                onClick={step === 3 && role === "candidate" ? handleCandidateDetailsNext : handleSubmit}
                className={primaryButtonClassName}
              >
                {step === 3 && role === "candidate"
                  ? isEnglish ? "Continue" : "Continuar"
                  : isEnglish ? "Finish registration" : "Terminar registro"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
