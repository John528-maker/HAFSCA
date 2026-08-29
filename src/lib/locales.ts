export const LOCALES = ["en", "ko"] as const;
export type CourseLocale = (typeof LOCALES)[number];

export function isCourseLocale(value: string): value is CourseLocale {
  return value === "en" || value === "ko";
}

export function otherLocale(locale: CourseLocale): CourseLocale {
  return locale === "en" ? "ko" : "en";
}
