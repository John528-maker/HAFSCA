import { LESSONS, lessonPath } from "@/curriculum/curriculum";
import { isCourseLocale, type CourseLocale } from "@/lib/locales";
import { getMessages } from "@/lib/i18n";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CourseMapPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isCourseLocale(lang)) notFound();
  const locale = lang as CourseLocale;
  const t = getMessages(locale);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">{t.course.map}</h1>
      <ol className="mt-8 space-y-3">
        {LESSONS.map((lesson) => (
          <li key={lesson.slug} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted">
              {lesson.order}. {lesson.difficulty}
              {!lesson.published && ` · ${t.course.coming}`}
            </p>
            <Link
              href={lessonPath(locale, lesson.slug)}
              className="text-lg font-medium text-accent"
            >
              {lesson.title[locale]}
            </Link>
            <p className="mt-1 text-sm text-muted">{lesson.summary[locale]}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
