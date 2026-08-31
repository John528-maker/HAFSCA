"use client";

import { useLanguage } from "@/components/LanguageProvider";
import ContinueCourse from "@/components/ContinueCourse";
import type { CourseLocale } from "@/lib/locales";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

const subscribeToHydration = () => () => {};

export default function SiteHeader({ lang }: { lang: CourseLocale }) {
  const { t, toggleLocale } = useLanguage();
  const pathname = usePathname();
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );

  const isHome = pathname === `/${lang}` || pathname === `/${lang}/`;
  const isLab = pathname.includes("/learn/double-descent");
  const isLearn = pathname.startsWith(`/${lang}/learn`) && !isLab;

  const links = [
    { href: `/${lang}`, label: t.nav.home, active: hydrated && isHome },
    { href: `/${lang}/learn`, label: t.nav.learn, active: hydrated && isLearn },
    {
      href: `/${lang}/learn/double-descent`,
      label: t.nav.experiments,
      active: hydrated && isLab,
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href={`/${lang}`}
          className="text-sm font-semibold tracking-wide text-foreground"
        >
          {t.siteName}
        </Link>
        <div className="flex items-center gap-3 sm:gap-5">
          <nav className="flex items-center gap-4 sm:gap-6" aria-label="Main">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors hover:text-foreground ${
                  link.active ? "text-foreground" : "text-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <ContinueCourse lang={lang} compact />
          <button
            type="button"
            onClick={toggleLocale}
            className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:bg-background hover:text-foreground"
            aria-label={`Switch to ${t.languageToggle}`}
          >
            {t.languageToggle}
          </button>
        </div>
      </div>
    </header>
  );
}
