"use client";

import { useLanguage } from "@/components/LanguageProvider";

export default function Header() {
  const { t, toggleLocale } = useLanguage();

  const links = [
    { href: "#experiments", label: t.nav.experiments },
    { href: "#concepts", label: t.nav.concepts },
    { href: "#about", label: t.nav.about },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="text-sm font-semibold tracking-wide text-foreground">
          {t.siteName}
        </a>
        <div className="flex items-center gap-3 sm:gap-5">
          <nav className="flex items-center gap-4 sm:gap-6" aria-label="Main">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>
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
