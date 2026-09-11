import type { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
}

export default function ConceptCard({ title, children }: Props) {
  return (
    <article className="card-3d p-5">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <div className="mt-2 text-sm leading-relaxed text-muted">{children}</div>
    </article>
  );
}
