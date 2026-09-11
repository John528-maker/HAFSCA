"use client";

import { useLanguage } from "@/components/LanguageProvider";

interface Props {
  notes: string[];
}

export default function AnalysisPanel({ notes }: Props) {
  const { t } = useLanguage();
  const a = t.analysis;

  if (notes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-5 text-sm text-muted">
        {a.empty}
      </div>
    );
  }

  return (
    <div className="card-3d p-5">
      <h3 className="text-sm font-extrabold text-muted">
        {a.title}
      </h3>
      <p className="mt-1 text-xs text-muted">{a.subtitle}</p>
      <ul className="mt-4 space-y-3">
        {notes.map((note, i) => (
          <li
            key={i}
            className="border-l-2 border-accent-soft pl-3 text-sm leading-relaxed text-foreground"
          >
            {note}
          </li>
        ))}
      </ul>
    </div>
  );
}
