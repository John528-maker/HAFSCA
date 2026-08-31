import { LESSONS } from "@/curriculum/curriculum";
import CourseMapList from "@/components/CourseMapList";
import { isCourseLocale, type CourseLocale } from "@/lib/locales";
import { getMessages } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function CourseMapPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isCourseLocale(lang)) notFound();
  const locale = lang as CourseLocale;
  const t = getMessages(locale);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">{t.course.map}</h1>
      <CourseMapList lang={locale} lessons={LESSONS} />
    </main>
  );
}
