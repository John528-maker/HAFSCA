import { getLesson, lessonPath } from "./curriculum.ts";
import { LOCALES, type CourseLocale } from "../lib/locales.ts";
import type { QuizQuestion } from "../lib/quiz.ts";

/**
 * Lesson slug → page that mounts the related lab.
 * null: the lesson links to its own quiz only.
 */
export const LESSON_LAB: Record<string, string | null> = {
  "functions-and-parameters": null,
  "linear-regression": "linear-regression",
  "loss-function": null,
  "polynomial-regression": "polynomial-regression",
  derivative: "derivative",
  "partial-derivative": null,
  gradient: "neural-network",
  "gradient-descent": "gradient-descent",
  optimization: "gradient-descent",
  "normal-equations": null,
  generalization: "generalization",
  overfitting: "overfitting",
  regularization: "regularization",
  "interpolation-threshold": "interpolation-threshold",
  conditioning: "conditioning",
  "double-descent": "double-descent",
  "neural-network": "neural-network",
  backpropagation: "backpropagation",
};

/** Same-page labs stay on #experiment. Other hosts open that lesson's lab. */
export function labHref(locale: CourseLocale, lessonSlug: string): string | null {
  const host = LESSON_LAB[lessonSlug];
  if (!host) return null;
  if (host === lessonSlug) return "#experiment";
  return `${lessonPath(locale, host)}#experiment`;
}

/** First slug in `order` that is not completed. Null when every slug is done. */
export function nextIncompleteSlug(
  order: readonly string[],
  completed: readonly string[],
): string | null {
  const done = new Set(completed);
  return order.find((slug) => !done.has(slug)) ?? null;
}

/** Every lesson has a link, a quiz in each locale, and a real lab host when set. */
export function assertLessonLinks(
  slugs: readonly string[],
  quizzes: Record<string, QuizQuestion[]>,
): string[] {
  const errors: string[] = [];
  const extra = new Set(Object.keys(LESSON_LAB));

  for (const slug of slugs) {
    if (!(slug in LESSON_LAB)) {
      errors.push(`${slug}: not linked`);
      continue;
    }
    extra.delete(slug);

    const lesson = getLesson(slug);
    const questions = quizzes[slug] ?? [];
    if (questions.length === 0) errors.push(`${slug}: no quiz`);

    for (const locale of LOCALES) {
      if (!lesson?.title[locale].trim() || !lesson.summary[locale].trim()) {
        errors.push(`${slug}: missing ${locale} lesson text`);
      }
      for (const question of questions) {
        if (!question.prompt[locale].trim()) {
          errors.push(`${slug}: quiz missing ${locale}`);
        }
      }
    }

    const host = LESSON_LAB[slug];
    if (!host) continue;
    const hostLesson = getLesson(host);
    if (!hostLesson?.experimentId) {
      errors.push(`${slug}: lab host ${host} has no experiment`);
      continue;
    }
    for (const locale of LOCALES) {
      if (!hostLesson.title[locale].trim()) {
        errors.push(`${slug}: lab host missing ${locale}`);
      }
    }
  }

  for (const slug of extra) errors.push(`${slug}: unknown lesson link`);
  return errors;
}
