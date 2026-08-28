"use client";

import ConceptCard from "@/components/ConceptCard";
import ExperimentWorkspace from "@/components/ExperimentWorkspace";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import { useLanguage } from "@/components/LanguageProvider";

export default function Home() {
  const { t } = useLanguage();

  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <ExperimentWorkspace />

        <section
          id="concepts"
          className="scroll-mt-16 border-t border-border bg-card"
        >
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="text-xl font-semibold tracking-tight">
              {t.concepts.title}
            </h2>
            <p className="mt-1 text-sm text-muted">{t.concepts.subtitle}</p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <ConceptCard title={t.concepts.overfittingTitle}>
                <p>{t.concepts.overfitting}</p>
              </ConceptCard>
              <ConceptCard title={t.concepts.thresholdTitle}>
                <p>{t.concepts.threshold}</p>
              </ConceptCard>
              <ConceptCard title={t.concepts.doubleDescentTitle}>
                <p>{t.concepts.doubleDescent}</p>
              </ConceptCard>
            </div>
          </div>
        </section>

        <section id="about" className="scroll-mt-16 border-t border-border">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="text-xl font-semibold tracking-tight">
              {t.about.title}
            </h2>
            <div className="mt-3 max-w-2xl space-y-3 text-sm leading-relaxed text-muted">
              <p>{t.about.p1}</p>
              <p>{t.about.p2}</p>
              <p>{t.about.p3}</p>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted">
        {t.footer}
      </footer>
    </>
  );
}
