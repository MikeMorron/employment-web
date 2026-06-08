export const LANGUAGE_FLAG_COUNTRY_CODE_MAP: Record<string, string> = {
  "Alemán": "de",
  "Albanés": "al",
  "Amárico": "et",
  "Árabe": "sa",
  "Árabe estándar": "sa",
  "Armenio": "am",
  "Aymara": "bo",
  "Azerí": "az",
  "Afrikaans": "za",
  "Bambara": "ml",
  "Bengalí": "bd",
  "Birmano": "mm",
  "Búlgaro": "bg",
  "Catalán": "es",
  "Checo": "cz",
  "Chino": "cn",
  "Chino mandarín": "cn",
  "Cingalés": "lk",
  "Coreano": "kr",
  "Criollo haitiano": "ht",
  "Croata": "hr",
  "Danés": "dk",
  "Eslovaco": "sk",
  "Esloveno": "si",
  "Español": "es",
  "Estonio": "ee",
  "Euskera": "es",
  "Filipino (tagalo)": "ph",
  "Finés": "fi",
  "Francés": "fr",
  "Fulani": "ng",
  "Fiyiano": "fj",
  "Galés": "gb",
  "Gallego": "es",
  "Georgiano": "ge",
  "Griego": "gr",
  "Guaraní": "py",
  "Hausa": "ng",
  "Hawaiano": "us",
  "Hebreo": "il",
  "Hindi": "in",
  "Húngaro": "hu",
  "Igbo": "ng",
  "Indonesio": "id",
  "Inglés": "gb",
  "Irlandés": "ie",
  "Islandés": "is",
  "Italiano": "it",
  "Japonés": "jp",
  "Kazajo": "kz",
  "Khmer": "kh",
  "Kinyarwanda": "rw",
  "Kirundi": "bi",
  "Kurdo": "iq",
  "Lao": "la",
  "Letón": "lv",
  "Lingala": "cd",
  "Lituano": "lt",
  "Luxemburgués": "lu",
  "Maorí": "nz",
  "Macedonio": "mk",
  "Malagasy": "mg",
  "Malayo": "my",
  "Maltés": "mt",
  "Mongol": "mn",
  "Náhuatl": "mx",
  "Nepalí": "np",
  "Neerlandés": "nl",
  "Noruego": "no",
  "Oromo": "et",
  "Papiamento": "aw",
  "Pashto": "af",
  "Persa (farsi)": "ir",
  "Polaco": "pl",
  "Portugués": "pt",
  "Punjabi": "in",
  "Quechua": "pe",
  "Rumano": "ro",
  "Ruso": "ru",
  "Samoano": "ws",
  "Serbio": "rs",
  "Somalí": "so",
  "Sueco": "se",
  "Swahili": "tz",
  "Tailandés": "th",
  "Tamil": "in",
  "Telugu": "in",
  "Tigrinya": "er",
  "Tongano": "to",
  "Turco": "tr",
  "Turcomano": "tm",
  "Ucraniano": "ua",
  "Urdu": "pk",
  "Uzbeko": "uz",
  "Vietnamita": "vn",
  "Wolof": "sn",
  "Xhosa": "za",
  "Yoruba": "ng",
  "Zulú": "za",
};

export const DEFAULT_LANGUAGE_FLAG_SRC = "/globe.svg";

function countryCodeToFlagEmoji(countryCode: string) {
  return countryCode
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

function buildLanguageFlagDataUri(countryCode: string) {
  const emoji = countryCodeToFlagEmoji(countryCode);
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="48" viewBox="0 0 64 48" role="img" aria-hidden="true">',
    '<rect width="64" height="48" rx="10" fill="#f8fafc"/>',
    '<rect x="0.75" y="0.75" width="62.5" height="46.5" rx="9.25" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>',
    `<text x="32" y="32" text-anchor="middle" font-size="24">${emoji}</text>`,
    "</svg>",
  ].join("");

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getLanguageFlagIconSrc(language: string) {
  const countryCode = LANGUAGE_FLAG_COUNTRY_CODE_MAP[language];
  return countryCode ? buildLanguageFlagDataUri(countryCode) : DEFAULT_LANGUAGE_FLAG_SRC;
}
