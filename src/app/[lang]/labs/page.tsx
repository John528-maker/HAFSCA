import { publishedLessons, lessonPath } from "@/curriculum/curriculum";
import { isCourseLocale, type CourseLocale } from "@/lib/locales";
import { getMessages } from "@/lib/i18n";
import Pressable from "@/components/Pressable";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LOCALES } from "@/lib/locales";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export default async function LabsIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isCourseLocale(lang)) notFound();
  const locale = lang as CourseLocale;
  const t = getMessages(locale);
  const labs = publishedLessons().filter((lesson) => lesson.experimentId);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-pretty text-3xl font-extrabold tracking-tight">
        {t.course.labsIndex}
      </h1>
      <p className="mt-2 text-muted">{t.nav.experiments}</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {labs.map((lesson) => (
          <li key={lesson.slug} className="card-3d p-5">
            <p className="text-xs font-extrabold text-accent">
              {t.course.hasExperiment}
            </p>
            <h2 className="mt-1 text-lg font-extrabold">{lesson.title[locale]}</h2>
            <p className="mt-1 text-sm text-muted">{lesson.summary[locale]}</p>
            <Pressable
              href={`${lessonPath(locale, lesson.slug)}#experiment`}
              className="mt-4 w-full"
            >
              {t.course.startLesson}
            </Pressable>
          </li>
        ))}
      </ul>
      <p className="mt-8">
        <Link
          href={`/${locale}/learn`}
          className="font-extrabold text-accent hover:underline"
        >
          {t.course.map}
        </Link>
      </p>
    </main>
  );
}
