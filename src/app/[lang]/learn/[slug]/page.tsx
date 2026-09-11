import LessonExperiment from "@/components/LessonExperiment";
import LessonNav from "@/components/LessonNav";
import {
  generateLessonParams,
  getLesson,
  lessonPath,
} from "@/curriculum/curriculum";
import { isCourseLocale, type CourseLocale } from "@/lib/locales";
import { getMessages } from "@/lib/i18n";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ComponentType } from "react";
import Link from "next/link";

export const dynamicParams = false;

export function generateStaticParams() {
  return generateLessonParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const lesson = getLesson(slug);
  if (!lesson || !isCourseLocale(lang)) return {};
  return {
    title: `${lesson.title[lang]} — AI Research Lab`,
    description: lesson.summary[lang],
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isCourseLocale(lang)) notFound();
  const locale = lang as CourseLocale;
  const lesson = getLesson(slug);
  if (!lesson) notFound();
  const t = getMessages(locale);

  let Body: ComponentType | null = null;
  if (lesson.published) {
    const mod = await import(`@/content/${locale}/${slug}.mdx`);
    Body = mod.default;
  }

  return (
    <>
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6">
        <LessonNav lang={locale} lesson={lesson} />
        {lesson.slug === "double-descent" && (
          <div className="space-y-3">
            <p className="card-3d px-4 py-3 text-sm">
              {t.course.briefing}
            </p>
            <p className="card-3d px-4 py-3 text-sm">
              {t.course.conditioningLink}{" "}
              <Link
                className="font-extrabold text-accent hover:underline"
                href={lessonPath(locale, "conditioning")}
              >
                {t.course.conditioningTitle}.
              </Link>
            </p>
          </div>
        )}
        {Body ? (
          <article className="lesson-prose">
            <Body />
          </article>
        ) : (
          <p className="text-muted">{t.course.coming}</p>
        )}
      </main>
      {lesson.experimentId && (
        <section
          id="experiment"
          className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6"
        >
          <h2 className="mb-3 scroll-mt-16 text-lg font-extrabold">
            {t.course.experiment}
          </h2>
          <LessonExperiment
            experimentId={lesson.experimentId}
            lang={locale}
            slug={lesson.slug}
          />
        </section>
      )}
    </>
  );
}
