"use client";

import { useLanguage } from "@/components/LanguageProvider";

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section
      id="top"
      className="border-b border-border bg-card"
      aria-labelledby="hero-title"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-muted">
          {t.hero.eyebrow}
        </p>
        <h1
          id="hero-title"
          className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-tight"
        >
          {t.hero.title1}
          <br />
          {t.hero.title2}
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted sm:text-lg">
          {t.hero.subtitle}
        </p>
        <a
          href="#experiments"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-accent px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {t.hero.cta}
        </a>
      </div>
    </section>
  );
}
