import { getPath } from "@/curriculum/paths";
import { isCourseLocale, type CourseLocale } from "@/lib/locales";
import { notFound } from "next/navigation";
import { LOCALES } from "@/lib/locales";
import { LEARNING_PATHS } from "@/curriculum/paths";
import PathActivator from "@/components/PathActivator";

export function generateStaticParams() {
  return LOCALES.flatMap((lang) =>
    LEARNING_PATHS.map((path) => ({ lang, pathId: path.id })),
  );
}

export default async function PathPage({
  params,
}: {
  params: Promise<{ lang: string; pathId: string }>;
}) {
  const { lang, pathId } = await params;
  if (!isCourseLocale(lang)) notFound();
  const locale = lang as CourseLocale;
  const path = getPath(pathId);
  if (!path) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-pretty text-3xl font-extrabold">{path.title[locale]}</h1>
      <p className="mt-2 text-muted">{path.description[locale]}</p>
      <PathActivator lang={locale} pathId={path.id} slugs={path.slugs} />
    </main>
  );
}
