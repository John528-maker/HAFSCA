"use client";

import { LESSONS, lessonPath, type LessonMeta } from "@/curriculum/curriculum";
import { CURRICULUM_VERSION } from "@/curriculum/version";
import { emptyProgress, loadProgress, subscribeProgress } from "@/lib/progress";
import { useLanguage } from "@/components/LanguageProvider";
import type { CourseLocale } from "@/lib/locales";
import Link from "next/link";
import { useSyncExternalStore } from "react";

const knownSlugs = LESSONS.map((lesson) => lesson.slug);

function subscribe(onChange: () => void) {
  return subscribeProgress(onChange);
}

function getSnapshot() {
  return loadProgress(knownSlugs, CURRICULUM_VERSION);
}

const SERVER_PROGRESS = emptyProgress(CURRICULUM_VERSION);

function getServerSnapshot() {
  return SERVER_PROGRESS;
}

export default function CourseMapList({
  lang,
  lessons,
}: {
  lang: CourseLocale;
  lessons: LessonMeta[];
}) {
  const { t } = useLanguage();
  const progress = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const done = new Set(progress.completedSlugs);

  return (
    <ol className="mt-8 space-y-3">
      {lessons.map((lesson) => (
        <li key={lesson.slug} className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted">
            {lesson.order}. {lesson.difficulty}
            {!lesson.published && ` · ${t.course.coming}`}
            {done.has(lesson.slug) && ` · ${t.course.completed}`}
          </p>
          <Link
            href={lessonPath(lang, lesson.slug)}
            className="text-lg font-medium text-accent"
          >
            {done.has(lesson.slug) ? "✓ " : ""}
            {lesson.title[lang]}
          </Link>
          <p className="mt-1 text-sm text-muted">{lesson.summary[lang]}</p>
        </li>
      ))}
    </ol>
  );
}
