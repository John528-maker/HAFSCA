import {
  getLesson,
  lessonPath,
  nextPublished,
  previousPublished,
  type LessonMeta,
} from "@/curriculum/curriculum";
import type { CourseLocale } from "@/lib/locales";
import { getMessages } from "@/lib/i18n";
import Link from "next/link";

export default function LessonNav({
  lang,
  lesson,
}: {
  lang: CourseLocale;
  lesson: LessonMeta;
}) {
  const t = getMessages(lang).course;
  const prev = previousPublished(lesson.slug);
  const next = nextPublished(lesson.slug);
  const prereqs = lesson.prerequisites
    .map((slug) => getLesson(slug))
    .filter((item): item is LessonMeta => item !== undefined);

  return (
    <div className="space-y-4 border-b border-border pb-6">
      <p className="text-xs uppercase tracking-wider text-muted">
        {lesson.difficulty} · {lesson.order}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">
        {lesson.title[lang]}
      </h1>
      <p className="text-muted">{lesson.summary[lang]}</p>
      {prereqs.length > 0 && (
        <p className="text-sm text-muted">
          {t.prereq}{" "}
          {prereqs.map((item, index) => (
            <span key={item.slug}>
              {index > 0 && ", "}
              <Link
                className="text-accent underline-offset-2 hover:underline"
                href={lessonPath(lang, item.slug)}
              >
                {item.title[lang]}
              </Link>
            </span>
          ))}
        </p>
      )}
      <div className="flex justify-between text-sm">
        {prev ? (
          <Link href={lessonPath(lang, prev.slug)} className="text-accent">
            ← {t.prev}: {prev.title[lang]}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={lessonPath(lang, next.slug)} className="text-accent">
            {t.next}: {next.title[lang]} →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
