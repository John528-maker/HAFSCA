"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { LESSONS } from "@/curriculum/curriculum";
import { CURRICULUM_VERSION } from "@/curriculum/version";
import type { CourseLocale } from "@/lib/locales";
import { emptyProgress, loadProgress, subscribeProgress } from "@/lib/progress";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ComponentType, type ReactNode } from "react";

const subscribeToHydration = () => () => {};
const knownSlugs = LESSONS.map((lesson) => lesson.slug);
const SERVER_PROGRESS = emptyProgress(CURRICULUM_VERSION);

function useCourseNav(lang: CourseLocale) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const isHome = pathname === `/${lang}` || pathname === `/${lang}/`;
  const isLabs = pathname.startsWith(`/${lang}/labs`);
  const inLesson = /^\/[^/]+\/learn\/[^/]+/.test(pathname);
  const isLearn =
    pathname.startsWith(`/${lang}/learn`) ||
    pathname.startsWith(`/${lang}/paths`);
  const links = [
    { href: `/${lang}`, label: t.nav.home, active: hydrated && isHome, icon: HomeIcon },
    {
      href: `/${lang}/learn`,
      label: t.nav.learn,
      active: hydrated && isLearn && !isLabs,
      icon: PathIcon,
    },
    {
      href: `/${lang}/labs`,
      label: t.nav.experiments,
      active: hydrated && isLabs,
      icon: LabIcon,
    },
  ];
  return { t, hydrated, links, inLesson };
}

export default function SiteHeader({ lang }: { lang: CourseLocale }) {
  const { t, toggleLocale } = useLanguage();
  const { hydrated, links, inLesson } = useCourseNav(lang);
  const progress = useSyncExternalStore(
    subscribeProgress,
    () => loadProgress(knownSlugs, CURRICULUM_VERSION),
    () => SERVER_PROGRESS,
  );

  const total = LESSONS.filter((lesson) => lesson.published).length;
  const done = progress.completedSlugs.filter((slug) =>
    LESSONS.some((lesson) => lesson.slug === slug && lesson.published),
  ).length;
  const ratio = total === 0 ? 0 : done / total;

  return (
    <header className="sticky top-0 z-40 border-b-2 border-border bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link
          href={`/${lang}`}
          className="flex min-h-11 min-w-0 items-center gap-2 font-extrabold text-foreground"
        >
          <LabMark />
          <span className="truncate">{t.siteName}</span>
        </Link>
        <div
          className={`mx-auto hidden min-w-0 flex-1 items-center gap-3 md:flex ${inLesson ? "md:hidden" : ""}`}
          aria-label={t.course.lessonsCount(done, total)}
        >
          <div className="hud-bar w-full max-w-xs">
            <span style={{ transform: `scaleX(${hydrated ? ratio : 0})` }} />
          </div>
          <p className="shrink-0 text-sm font-extrabold tabular-nums text-accent">
            {hydrated ? t.course.progressOf(done, total) : t.course.progressOf(0, total)}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <nav className={`hidden items-center gap-1 md:flex ${inLesson ? "md:hidden" : ""}`} aria-label="Main">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex min-h-11 items-center rounded-2xl px-3 text-sm font-extrabold transition-colors ${
                  link.active ? "text-accent" : "text-muted hover:text-foreground"
                }`}
              >
                <span
                  className={`border-b-4 py-1 ${
                    link.active ? "border-feather" : "border-transparent"
                  }`}
                >
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={toggleLocale}
            className="press press-secondary press-sm min-w-11 px-3"
            aria-label={`Switch to ${t.languageToggle}`}
          >
            {t.languageToggle}
          </button>
        </div>
      </div>
      <div className={`border-t-2 border-border px-4 py-2 md:hidden ${inLesson ? "hidden" : ""}`}>
        <div className="flex items-center gap-3">
          <div className="hud-bar min-w-0 flex-1">
            <span style={{ transform: `scaleX(${hydrated ? ratio : 0})` }} />
          </div>
          <p className="text-xs font-extrabold tabular-nums text-accent">
            {hydrated ? t.course.progressOf(done, total) : t.course.progressOf(0, total)}
          </p>
        </div>
      </div>
    </header>
  );
}

export function SiteDock({ lang }: { lang: CourseLocale }) {
  const { links, inLesson } = useCourseNav(lang);
  if (inLesson) return null;
  return (
    <nav className="dock md:hidden" aria-label="Main">
      <ul className="mx-auto grid max-w-lg grid-cols-3">
        {links.map((link) => {
          const Icon = link.icon as ComponentType;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-extrabold ${
                  link.active ? "text-accent" : "text-muted"
                }`}
                aria-current={link.active ? "page" : undefined}
              >
                <Icon />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function LabMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden="true">
      <rect width="32" height="32" rx="10" fill="#58cc02" />
      <rect x="0" y="24" width="32" height="8" rx="4" fill="#46a302" />
      <path
        d="M12 8h8v2h-1.2l-2.3 10.2a3.6 3.6 0 0 1-7 0L7.2 10H6V8h6zm1.4 2-.9 4h6.9l-.9-4h-5.1z"
        fill="#14532d"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <IconWrap>
      <path d="M12 4.6 4.2 11.2h2.3V20h5.1v-5.2h2.8V20h5.1v-8.8h2.3L12 4.6Z" />
    </IconWrap>
  );
}

function PathIcon() {
  return (
    <IconWrap>
      <circle cx="8" cy="7" r="2.4" />
      <circle cx="16" cy="12" r="2.4" />
      <circle cx="8" cy="17.5" r="2.4" />
      <path
        d="M9.8 8.6 14 11.1M14.2 13.6 9.9 16.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </IconWrap>
  );
}

function LabIcon() {
  return (
    <IconWrap>
      <path d="M9 4h6v2h-1v4.2l5 8.4A3.2 3.2 0 0 1 16.1 20H7.9A3.2 3.2 0 0 1 6 18.6l5-8.4V6H9V4Z" />
    </IconWrap>
  );
}

function IconWrap({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="currentColor"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
