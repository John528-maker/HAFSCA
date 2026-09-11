"use client";

import { LEARNING_PATHS } from "@/curriculum/paths";
import { LESSONS, getLesson } from "@/curriculum/curriculum";
import { CURRICULUM_VERSION } from "@/curriculum/version";
import { emptyProgress, loadProgress, subscribeProgress } from "@/lib/progress";
import { useLanguage } from "@/components/LanguageProvider";
import Pressable from "@/components/Pressable";
import type { CourseLocale } from "@/lib/locales";
import { useSyncExternalStore } from "react";

const knownSlugs = LESSONS.map((lesson) => lesson.slug);
const SERVER_PROGRESS = emptyProgress(CURRICULUM_VERSION);

export default function LearningPathCards({ lang }: { lang: CourseLocale }) {
  const { t } = useLanguage();
  const progress = useSyncExternalStore(
    subscribeProgress,
    () => loadProgress(knownSlugs, CURRICULUM_VERSION),
    () => SERVER_PROGRESS,
  );
  const done = new Set(progress.completedSlugs);

  return (
    <ul className="mt-10 space-y-4">
      {LEARNING_PATHS.map((path) => {
        const total = path.slugs.length;
        const finished = path.slugs.filter((slug) => done.has(slug)).length;
        const ratio = total === 0 ? 0 : finished / total;
        const firstIncomplete = path.slugs.find((slug) => {
          const lesson = getLesson(slug);
          return lesson?.published && !done.has(slug);
        });
        return (
          <li key={path.id} className="card-3d p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-extrabold">{path.title[lang]}</h2>
              <p className="text-sm font-extrabold tabular-nums text-accent">
                {t.course.progressOf(finished, total)}
              </p>
            </div>
            <p className="mt-1 text-sm text-muted">{path.description[lang]}</p>
            <div className="hud-bar mt-4">
              <span style={{ transform: `scaleX(${ratio})` }} />
            </div>
            <div className="mt-4">
              <Pressable
                href={`/${lang}/paths/${path.id}`}
                variant={firstIncomplete ? "primary" : "secondary"}
                className="w-full sm:w-auto"
              >
                {firstIncomplete ? t.course.startLesson : t.course.review}
              </Pressable>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
