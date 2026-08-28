import { notFound } from "next/navigation";

const locales = ["en", "ko"] as const;
const slugs = ["linear-regression"] as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((lang) => slugs.map((slug) => ({ lang, slug })));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;

  if (
    !locales.includes(lang as (typeof locales)[number]) ||
    !slugs.includes(slug as (typeof slugs)[number])
  ) {
    notFound();
  }

  const { default: Lesson } = await import(`@/content/${lang}/${slug}.mdx`);

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
      <Lesson />
    </main>
  );
}
