"use client";

import {
  getLesson,
  lessonPath,
  LESSONS,
  type LessonMeta,
} from "@/curriculum/curriculum";
import { CURRICULUM_VERSION } from "@/curriculum/version";
import { useLanguage } from "@/components/LanguageProvider";
import type { CourseLocale } from "@/lib/locales";
import { emptyProgress, loadProgress, subscribeProgress } from "@/lib/progress";
import Link from "next/link";
import { useSyncExternalStore } from "react";

const knownSlugs = LESSONS.map((lesson) => lesson.slug);
const SERVER_PROGRESS = emptyProgress(CURRICULUM_VERSION);

export default function LessonNav({
  lang,
  lesson,
}: {
  lang: CourseLocale;
  lesson: LessonMeta;
}) {
  const { t } = useLanguage();
  const course = t.course;
  const progress = useSyncExternalStore(
    subscribeProgress,
    () => loadProgress(knownSlugs, CURRICULUM_VERSION),
    () => SERVER_PROGRESS,
  );
  const prereqs = lesson.prerequisites
    .map((slug) => getLesson(slug))
    .filter((item): item is LessonMeta => item !== undefined);
  const missingPrereqs = prereqs.filter(
    (item) => !progress.completedSlugs.includes(item.slug),
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Link
          href={`/${lang}/learn`}
          className="press press-secondary press-sm min-w-11 px-3"
          aria-label={t.quiz.closeLesson}
        >
          ×
        </Link>
        <h1 className="min-w-0 truncate text-pretty text-lg font-extrabold tracking-tight">
          {lesson.title[lang]}
        </h1>
        {lesson.experimentId && (
          <a
            href="#experiment"
            className="ml-auto shrink-0 text-sm font-extrabold text-accent hover:underline"
          >
            {course.skipExperiment}
          </a>
        )}
      </div>
      {missingPrereqs.length > 0 && (
        <div
          role="status"
          className="card-3d border-threshold/40 px-4 py-3 text-sm"
        >
          <p>{course.prereqMissing}</p>
          <p className="mt-2 text-muted">
            {missingPrereqs.map((item, index) => (
              <span key={item.slug}>
                {index > 0 && ", "}
                <Link
                  className="font-extrabold text-accent hover:underline"
                  href={lessonPath(lang, item.slug)}
                >
                  {item.title[lang]}
                </Link>
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
}
