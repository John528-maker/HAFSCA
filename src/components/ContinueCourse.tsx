"use client";

import { LESSONS, getLesson, lessonPath } from "@/curriculum/curriculum";
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

export default function ContinueCourse({
  lang,
  compact = false,
}: {
  lang: CourseLocale;
  compact?: boolean;
}) {
  const { t } = useLanguage();
  const progress = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const lesson = progress.lastLessonSlug
    ? getLesson(progress.lastLessonSlug)
    : undefined;
  if (!lesson) return null;
  if (compact) {
    return (
      <Link
        href={lessonPath(lang, lesson.slug)}
        className="text-xs text-accent"
      >
        {t.course.continue}
      </Link>
    );
  }
  return (
    <Link
      href={lessonPath(lang, lesson.slug)}
      className="inline-flex h-11 items-center rounded-md border border-accent px-5 text-sm font-medium text-accent"
    >
      {t.course.continue}: {lesson.title[lang]}
    </Link>
  );
}
