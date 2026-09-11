"use client";

import { LESSONS, getLesson, lessonPath } from "@/curriculum/curriculum";
import { CURRICULUM_VERSION } from "@/curriculum/version";
import { emptyProgress, loadProgress, subscribeProgress } from "@/lib/progress";
import { useLanguage } from "@/components/LanguageProvider";
import Pressable from "@/components/Pressable";
import type { CourseLocale } from "@/lib/locales";
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
      <Pressable href={lessonPath(lang, lesson.slug)} variant="ghost" className="press-sm">
        {t.course.continue}
      </Pressable>
    );
  }
  return (
    <Pressable href={lessonPath(lang, lesson.slug)} variant="secondary">
      {t.course.continue}: {lesson.title[lang]}
    </Pressable>
  );
}
