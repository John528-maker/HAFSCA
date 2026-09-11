"use client";

import { LESSONS, getLesson, lessonPath, publishedLessons } from "@/curriculum/curriculum";
import { CURRICULUM_VERSION } from "@/curriculum/version";
import { emptyProgress, loadProgress, subscribeProgress } from "@/lib/progress";
import { useLanguage } from "@/components/LanguageProvider";
import Pressable from "@/components/Pressable";
import type { CourseLocale } from "@/lib/locales";
import { useSyncExternalStore } from "react";

const knownSlugs = LESSONS.map((lesson) => lesson.slug);
const SERVER_PROGRESS = emptyProgress(CURRICULUM_VERSION);

/** One primary CTA: Continue when progress exists, otherwise Start. */
export default function LobbyPrimaryCta({ lang }: { lang: CourseLocale }) {
  const { t } = useLanguage();
  const progress = useSyncExternalStore(
    subscribeProgress,
    () => loadProgress(knownSlugs, CURRICULUM_VERSION),
    () => SERVER_PROGRESS,
  );
  const resume = progress.lastLessonSlug
    ? getLesson(progress.lastLessonSlug)
    : undefined;
  const first = publishedLessons()[0]!;

  if (resume) {
    return (
      <Pressable href={lessonPath(lang, resume.slug)} className="w-full sm:w-auto">
        {t.course.continue}: {resume.title[lang]}
      </Pressable>
    );
  }

  return (
    <Pressable href={lessonPath(lang, first.slug)} className="w-full sm:w-auto">
      {t.course.start}
    </Pressable>
  );
}
