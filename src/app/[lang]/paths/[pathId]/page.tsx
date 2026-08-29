import { getPath } from "@/curriculum/paths";
import { getLesson, lessonPath } from "@/curriculum/curriculum";
import { isCourseLocale, type CourseLocale } from "@/lib/locales";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LOCALES } from "@/lib/locales";
import { LEARNING_PATHS } from "@/curriculum/paths";

export function generateStaticParams() {
  return LOCALES.flatMap((lang) =>
    LEARNING_PATHS.map((path) => ({ lang, pathId: path.id })),
  );
}

export default async function PathPage({
  params,
}: {
  params: Promise<{ lang: string; pathId: string }>;
}) {
  const { lang, pathId } = await params;
  if (!isCourseLocale(lang)) notFound();
  const locale = lang as CourseLocale;
  const path = getPath(pathId);
  if (!path) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold">{path.title[locale]}</h1>
      <p className="mt-2 text-muted">{path.description[locale]}</p>
      <ol className="mt-8 list-decimal space-y-3 pl-5">
        {path.slugs.map((slug) => {
          const lesson = getLesson(slug);
          if (!lesson) return null;
          return (
            <li key={slug}>
              <Link href={lessonPath(locale, slug)} className="text-accent">
                {lesson.title[locale]}
              </Link>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
