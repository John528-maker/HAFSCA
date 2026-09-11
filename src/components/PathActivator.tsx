"use client";

import { LessonTrack } from "@/components/CourseMapList";
import Pressable from "@/components/Pressable";
import { LESSONS, getLesson, lessonPath } from "@/curriculum/curriculum";
import { CURRICULUM_VERSION } from "@/curriculum/version";
import {
  emptyProgress,
  loadProgress,
  setActivePath,
  subscribeProgress,
} from "@/lib/progress";
import { useLanguage } from "@/components/LanguageProvider";
import type { CourseLocale } from "@/lib/locales";
import { useEffect, useSyncExternalStore } from "react";

const knownSlugs = LESSONS.map((lesson) => lesson.slug);
const SERVER_PROGRESS = emptyProgress(CURRICULUM_VERSION);

/** Marks the visited path as active so prev/next follow it. */
export default function PathActivator({
  lang,
  pathId,
  slugs,
}: {
  lang: CourseLocale;
  pathId: string;
  slugs: string[];
}) {
  const { t } = useLanguage();
  const progress = useSyncExternalStore(
    subscribeProgress,
    () => loadProgress(knownSlugs, CURRICULUM_VERSION),
    () => SERVER_PROGRESS,
  );

  useEffect(() => {
    setActivePath(pathId, knownSlugs, CURRICULUM_VERSION);
  }, [pathId]);

  const lessons = slugs
    .map((slug) => getLesson(slug))
    .filter((lesson): lesson is NonNullable<typeof lesson> => Boolean(lesson));
  const done = new Set(progress.completedSlugs);
  const currentSlug =
    lessons.find((lesson) => lesson.published && !done.has(lesson.slug))?.slug ??
    slugs[0];
  const finished = lessons.filter((lesson) => done.has(lesson.slug)).length;
  const startSlug = currentSlug ?? slugs[0]!;
  const cta =
    finished === lessons.length
      ? t.course.review
      : finished > 0
        ? t.course.continue
        : t.course.start;

  return (
    <div className="mt-6">
      <Pressable href={lessonPath(lang, startSlug)} className="w-full sm:w-auto">
        {cta}
      </Pressable>
      <LessonTrack
        lang={lang}
        lessons={lessons}
        done={done}
        currentSlug={currentSlug}
        comingLabel={t.course.coming}
        experimentLabel={t.course.hasExperiment}
        upNextLabel={t.course.upNext}
      />
    </div>
  );
}
