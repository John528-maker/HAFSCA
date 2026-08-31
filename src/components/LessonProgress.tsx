"use client";

import { LESSONS } from "@/curriculum/curriculum";
import { CURRICULUM_VERSION } from "@/curriculum/version";
import {
  emptyProgress,
  loadProgress,
  subscribeProgress,
  toggleLessonComplete,
  touchLastLesson,
} from "@/lib/progress";
import { useLanguage } from "@/components/LanguageProvider";
import { useEffect, useSyncExternalStore } from "react";

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

export default function LessonProgress({ slug }: { slug: string }) {
  const { t } = useLanguage();
  const progress = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const done = progress.completedSlugs.includes(slug);

  useEffect(() => {
    touchLastLesson(slug, knownSlugs, CURRICULUM_VERSION);
  }, [slug]);

  return (
    <button
      type="button"
      className="rounded-md border border-border px-3 py-1.5 text-sm"
      onClick={() => {
        toggleLessonComplete(slug, knownSlugs, CURRICULUM_VERSION);
      }}
    >
      {done ? t.course.done : t.course.markDone}
    </button>
  );
}
