import { LanguageProvider } from "@/components/LanguageProvider";
import SiteHeader from "@/components/SiteHeader";
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

  return (
    <LanguageProvider locale={lang}>
      <SiteHeader lang={lang as CourseLocale} />
      <div className="flex-1">{children}</div>
      <footer className="border-t border-border py-6 text-center text-xs text-muted">
        {t.footer}
      </footer>
    </LanguageProvider>
  );
}
