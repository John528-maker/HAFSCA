import type { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
}

export default function ConceptCard({ title, children }: Props) {
  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <div className="mt-2 text-sm leading-relaxed text-muted">{children}</div>
    </article>
  );
}
