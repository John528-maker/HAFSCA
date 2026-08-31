import { LEARNING_PATHS } from "@/curriculum/paths";
import { publishedLessons, lessonPath } from "@/curriculum/curriculum";
import { isCourseLocale, type CourseLocale } from "@/lib/locales";
import { getMessages } from "@/lib/i18n";
import ContinueCourse from "@/components/ContinueCourse";
import Link from "next/link";
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
  const first = publishedLessons()[0]!;

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
        {t.hero.eyebrow}
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        {t.hero.title1}
        <br />
        {t.hero.title2}
      </h1>
      <p className="mt-4 text-lg text-muted">{t.hero.subtitle}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ContinueCourse lang={locale} />
        <Link
          href={lessonPath(locale, first.slug)}
          className="inline-flex h-11 items-center rounded-md bg-accent px-5 text-sm font-medium text-white"
        >
          {t.course.start}
        </Link>
        <Link
          href={lessonPath(locale, "double-descent")}
          className="inline-flex h-11 items-center rounded-md border border-border px-5 text-sm font-medium"
        >
          {t.course.lab}
        </Link>
        <Link
          href={`/${locale}/learn`}
          className="inline-flex h-11 items-center px-5 text-sm text-accent"
        >
          {t.course.map}
        </Link>
      </div>
      <ul className="mt-12 space-y-4">
        {LEARNING_PATHS.map((path) => (
          <li key={path.id} className="rounded-lg border border-border bg-card p-4">
            <h2 className="font-semibold">{path.title[locale]}</h2>
            <p className="mt-1 text-sm text-muted">{path.description[locale]}</p>
            <Link
              href={`/${locale}/paths/${path.id}`}
              className="mt-2 inline-block text-sm text-accent"
            >
              {path.title[locale]} →
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
