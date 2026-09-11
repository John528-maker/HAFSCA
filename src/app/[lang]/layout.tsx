import { LanguageProvider } from "@/components/LanguageProvider";
import SiteHeader, { SiteDock } from "@/components/SiteHeader";
import { LOCALES, isCourseLocale, type CourseLocale } from "@/lib/locales";
import { getMessages } from "@/lib/i18n";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isCourseLocale(lang)) notFound();
  const t = getMessages(lang);
  const htmlLang = lang === "ko" ? "ko" : "en";

  return (
    <LanguageProvider locale={lang}>
      <a href="#main" className="skip-link">
        {t.skipToContent}
      </a>
      <SiteHeader lang={lang as CourseLocale} />
      <div
        className="flex-1 pb-24 md:pb-0"
        id="main"
        tabIndex={-1}
        lang={htmlLang}
      >
        {children}
      </div>
      <footer className="hidden border-t-2 border-border py-6 text-center text-xs text-muted md:block">
        {t.footer}
      </footer>
      <SiteDock lang={lang as CourseLocale} />
    </LanguageProvider>
  );
}
