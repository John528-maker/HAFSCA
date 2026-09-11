import type { CourseLocale } from "@/lib/locales";

export interface QuizQuestion {
  id: string;
  prompt: Record<CourseLocale, string>;
  choices: Array<Record<CourseLocale, string>>;
  correctIndex: number;
  why: Record<CourseLocale, string>;
}

export function localeText(
  record: Record<CourseLocale, string>,
  locale: CourseLocale,
): string {
  return record[locale];
}

export function isCorrectChoice(
  question: QuizQuestion,
  choiceIndex: number,
): boolean {
  return choiceIndex === question.correctIndex;
}

export function assertQuizBank(
  bank: Record<string, QuizQuestion[]>,
  requiredSlugs: readonly string[],
): string[] {
  const errors: string[] = [];
  for (const slug of requiredSlugs) {
    const questions = bank[slug];
    if (!questions || questions.length < 3) {
      errors.push(`${slug}: need at least 3 questions`);
      continue;
    }
    const ids = new Set<string>();
    for (const question of questions) {
      if (!question.id || ids.has(question.id)) {
        errors.push(`${slug}: duplicate or empty id ${question.id}`);
      }
      ids.add(question.id);
      if (question.choices.length < 2) {
        errors.push(`${slug}/${question.id}: need at least 2 choices`);
      }
      if (
        question.correctIndex < 0 ||
        question.correctIndex >= question.choices.length
      ) {
        errors.push(`${slug}/${question.id}: correctIndex out of range`);
      }
      if (!question.prompt.en.trim() || !question.prompt.ko.trim()) {
        errors.push(`${slug}/${question.id}: empty prompt`);
      }
      for (const [index, choice] of question.choices.entries()) {
        if (!choice.en.trim() || !choice.ko.trim()) {
          errors.push(`${slug}/${question.id}: empty choice ${index}`);
        }
      }
      if (!question.why.en.trim() || !question.why.ko.trim()) {
        errors.push(`${slug}/${question.id}: empty explanation`);
      }
    }
  }
  return errors;
}
