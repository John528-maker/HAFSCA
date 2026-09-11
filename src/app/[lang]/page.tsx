import LearningPathCards from "@/components/LearningPathCards";
import LobbyPrimaryCta from "@/components/LobbyPrimaryCta";
import Pressable from "@/components/Pressable";
import { isCourseLocale, type CourseLocale } from "@/lib/locales";
import { getMessages } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function LobbyPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isCourseLocale(lang)) notFound();
  const locale = lang as CourseLocale;
  const t = getMessages(locale);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-pretty text-4xl font-extrabold tracking-tight sm:text-5xl">
        {t.hero.title1}
        <br />
        {t.hero.title2}
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted">{t.hero.subtitle}</p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <LobbyPrimaryCta lang={locale} />
        <Pressable href={`/${locale}/labs`} variant="secondary">
          {t.course.labsIndex}
        </Pressable>
        <Pressable href={`/${locale}/learn`} variant="ghost">
          {t.course.map}
        </Pressable>
      </div>
      <LearningPathCards lang={locale} />
    </main>
  );
}
