"use client";

import { LESSONS, lessonPath, type LessonMeta } from "@/curriculum/curriculum";
import { actForSlug, COURSE_ACTS } from "@/curriculum/paths";
import { CURRICULUM_VERSION } from "@/curriculum/version";
import { emptyProgress, loadProgress, subscribeProgress } from "@/lib/progress";
import { useLanguage } from "@/components/LanguageProvider";
import type { CourseLocale } from "@/lib/locales";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";

const knownSlugs = LESSONS.map((lesson) => lesson.slug);
const SERVER_PROGRESS = emptyProgress(CURRICULUM_VERSION);

function actLabel(
  id: "fit" | "generalize" | "scale",
  t: ReturnType<typeof useLanguage>["t"]["course"],
): string {
  if (id === "fit") return t.actFit;
  if (id === "generalize") return t.actGeneralize;
  return t.actScale;
}

export default function CourseMapList({
  lang,
  lessons,
}: {
  lang: CourseLocale;
  lessons: LessonMeta[];
}) {
  const { t } = useLanguage();
  const progress = useSyncExternalStore(
    subscribeProgress,
    () => loadProgress(knownSlugs, CURRICULUM_VERSION),
    () => SERVER_PROGRESS,
  );
  const done = new Set(progress.completedSlugs);
  const currentSlug = lessons.find(
    (lesson) => lesson.published && !done.has(lesson.slug),
  )?.slug;

  const groups = useMemo(() => {
    return COURSE_ACTS.map((act) => ({
      id: act.id,
      lessons: lessons.filter((lesson) => act.slugSet.has(lesson.slug)),
    })).filter((group) => group.lessons.length > 0);
  }, [lessons]);

  const orphan = lessons.filter((lesson) => !actForSlug(lesson.slug));

  return (
    <div className="mt-8 space-y-12">
      {groups.map((group) => {
        const finished = group.lessons.filter((lesson) => done.has(lesson.slug)).length;
        return (
          <section key={group.id} aria-labelledby={`act-${group.id}`}>
            <div className={`unit-banner unit-${group.id}`}>
              <h2 id={`act-${group.id}`} className="text-lg">
                {actLabel(group.id, t.course)}
              </h2>
              <p className="tabular-nums">
                {t.course.progressOf(finished, group.lessons.length)}
              </p>
            </div>
            <LessonTrack
              lang={lang}
              lessons={group.lessons}
              done={done}
              currentSlug={currentSlug}
              comingLabel={t.course.coming}
              experimentLabel={t.course.hasExperiment}
              upNextLabel={t.course.upNext}
            />
          </section>
        );
      })}
      {orphan.length > 0 && (
        <LessonTrack
          lang={lang}
          lessons={orphan}
          done={done}
          currentSlug={currentSlug}
          comingLabel={t.course.coming}
          experimentLabel={t.course.hasExperiment}
          upNextLabel={t.course.upNext}
        />
      )}
    </div>
  );
}

export function LessonTrack({
  lang,
  lessons,
  done,
  currentSlug,
  comingLabel,
  experimentLabel,
  upNextLabel,
}: {
  lang: CourseLocale;
  lessons: LessonMeta[];
  done: Set<string>;
  currentSlug?: string;
  comingLabel: string;
  experimentLabel: string;
  upNextLabel: string;
}) {
  return (
    <ol className="path-track mt-6">
      {lessons.map((lesson, index) => (
        <PathNode
          key={lesson.slug}
          lang={lang}
          lesson={lesson}
          index={index}
          done={done.has(lesson.slug)}
          current={lesson.slug === currentSlug}
          comingLabel={comingLabel}
          experimentLabel={experimentLabel}
          upNextLabel={upNextLabel}
        />
      ))}
    </ol>
  );
}

function PathNode({
  lang,
  lesson,
  index,
  done,
  current,
  comingLabel,
  experimentLabel,
  upNextLabel,
}: {
  lang: CourseLocale;
  lesson: LessonMeta;
  index: number;
  done: boolean;
  current: boolean;
  comingLabel: string;
  experimentLabel: string;
  upNextLabel: string;
}) {
  const href = lesson.experimentId
    ? `${lessonPath(lang, lesson.slug)}#experiment`
    : lessonPath(lang, lesson.slug);
  const state = !lesson.published
    ? "locked"
    : done
      ? "done"
      : current
        ? "current"
        : "todo";

  return (
    <li
      className={`path-step ${index % 2 === 0 ? "path-step-left" : "path-step-right"}`}
    >
      <Link
        href={href}
        className={`path-node path-node-${state}`}
        aria-current={current ? "step" : undefined}
        aria-label={`${lesson.order}. ${lesson.title[lang]}`}
      >
        {current ? <span className="path-node-ring" aria-hidden="true" /> : null}
        {done ? <CheckIcon /> : lesson.order}
      </Link>
      <div className="path-node-copy">
        <p className="text-sm font-extrabold text-foreground">{lesson.title[lang]}</p>
        {!lesson.published ? (
          <p className="text-xs text-muted">{comingLabel}</p>
        ) : null}
        {lesson.experimentId ? (
          <span className="path-chip">{experimentLabel}</span>
        ) : null}
        {current ? <span className="path-chip">{upNextLabel}</span> : null}
      </div>
    </li>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
      <path
        d="M6 12.5 10.2 17 18 8"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
