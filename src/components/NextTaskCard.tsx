"use client";

import Pressable from "@/components/Pressable";
import { useLanguage } from "@/components/LanguageProvider";
import { LESSONS, getLesson, lessonPath } from "@/curriculum/curriculum";
import { nextIncompleteSlug } from "@/curriculum/lessonLinks";
import { getPath, resolvePathId } from "@/curriculum/paths";
import { CURRICULUM_VERSION } from "@/curriculum/version";
import { emptyProgress, loadProgress, subscribeProgress } from "@/lib/progress";
import type { CourseLocale } from "@/lib/locales";
import { useSyncExternalStore } from "react";

const knownSlugs = LESSONS.map((lesson) => lesson.slug);
const SERVER_PROGRESS = emptyProgress(CURRICULUM_VERSION);

/** First unfinished lesson on the active path. */
export default function NextTaskCard({ lang }: { lang: CourseLocale }) {
  const { t } = useLanguage();
  const progress = useSyncExternalStore(
    subscribeProgress,
    () => loadProgress(knownSlugs, CURRICULUM_VERSION),
    () => SERVER_PROGRESS,
  );
  const path = getPath(resolvePathId(progress.activePathId))!;
  const slug = nextIncompleteSlug(path.slugs, progress.completedSlugs);
  const lesson = slug ? getLesson(slug) : undefined;

  if (!lesson) {
    return (
      <section className="card-3d mt-10 p-5" aria-labelledby="next-task-title">
        <h2 id="next-task-title" className="text-lg font-extrabold">
          {t.course.nextTask}
        </h2>
        <p className="mt-1 text-sm text-muted">{t.course.nextTaskDone}</p>
        <Pressable href={`/${lang}/learn`} variant="secondary" className="mt-4">
          {t.course.map}
        </Pressable>
      </section>
    );
  }

  const resume = progress.lastLessonSlug === lesson.slug;

  return (
    <section className="card-3d mt-10 p-5" aria-labelledby="next-task-title">
      <h2 id="next-task-title" className="text-xs font-extrabold text-accent">
        {t.course.nextTask}
      </h2>
      <p className="mt-1 text-lg font-extrabold">{lesson.title[lang]}</p>
      <p className="mt-1 text-sm text-muted">{lesson.summary[lang]}</p>
      <Pressable
        href={lessonPath(lang, lesson.slug)}
        className="mt-4 w-full sm:w-auto"
      >
        {resume ? t.course.continue : t.course.startLesson}
      </Pressable>
    </section>
  );
}
