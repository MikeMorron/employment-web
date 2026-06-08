import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, Space_Grotesk, Cormorant_Garamond } from "next/font/google";
import { I18nClientProvider } from "@/compartido/components/providers/i18n-client-provider";
import type { I18nLanguage } from "@/compartido/lib/i18n/resources";
import { LanguagePreferenceSync } from "@/components/ui/language-preference-sync";
import { RouteHistoryTracker } from "@/components/ui/route-history-tracker";
import { UploadedImageProtection } from "@/components/ui/uploaded-image-protection";
import { LANGUAGE_COOKIE_KEYS, THEME_COOKIE_KEYS, readCookieValue } from "@/lib/app-runtime";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant-garamond",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TalentSyncro | Trabajos en Colombia",
  description: "Plataforma de vacantes y talento enfocada en el mercado laboral colombiano.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  noStore();
  const cookieStore = await cookies();
  const storedTheme = readCookieValue(cookieStore.toString(), THEME_COOKIE_KEYS);
  const initialTheme = storedTheme === "dark" ? "dark" : "light";
  const localeCookie = readCookieValue(cookieStore.toString(), LANGUAGE_COOKIE_KEYS);
  const locale: I18nLanguage = localeCookie === "en" ? "en" : "es";

  return (
    <html
      lang={locale}
      data-language={locale}
      data-theme={initialTheme}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${cormorantGaramond.variable} antialiased`}
      >
        <I18nClientProvider initialLanguage={locale}>
          <UploadedImageProtection />
          <LanguagePreferenceSync />
          <RouteHistoryTracker />
          {children}
        </I18nClientProvider>
      </body>
    </html>
  );
}
