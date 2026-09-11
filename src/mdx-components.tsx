import type { MDXComponents } from "mdx/types";
import type { ReactNode } from "react";
import LessonDeck from "@/components/LessonDeck";

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) {
    const props = (node as { props?: { children?: ReactNode } }).props;
    return textOf(props?.children);
  }
  return "";
}

/** Map common lesson section titles to stable hash ids. */
function stageId(children: ReactNode): string | undefined {
  const raw = textOf(children).trim().toLowerCase();
  if (!raw) return undefined;
  if (
    raw.includes("what is") ||
    raw.includes("무엇인가") ||
    raw === "what is it?"
  ) {
    return "what";
  }
  if (raw.includes("why") || raw.includes("왜")) return "why";
  if (raw.includes("intuition") || raw.includes("직관")) return "intuition";
  if (
    raw.includes("mathematics") ||
    raw.includes("수학") ||
    raw.includes("derivation")
  ) {
    return "mathematics";
  }
  if (raw.includes("experiment") || raw.includes("실험")) return "lesson-experiment";
  if (raw.includes("summary") || raw.includes("요약")) return "summary";
  return undefined;
}

const headingClass = {
  h2: "mt-10 scroll-mt-20 text-2xl font-extrabold tracking-tight text-pretty",
  h3: "mt-8 scroll-mt-20 text-xl font-extrabold tracking-tight text-pretty",
  h4: "mt-6 scroll-mt-20 text-lg font-extrabold tracking-tight text-pretty",
} as const;

const components: MDXComponents = {
  wrapper: LessonDeck,
  // LessonNav already owns the page <h1>; MDX `#` becomes h2 for hierarchy.
  h1: (props) => {
    const { children, ...rest } = props;
    const id = stageId(children);
    return (
      <h2 className={headingClass.h2} {...rest} id={id} data-stage={id}>
        {children}
      </h2>
    );
  },
  h2: (props) => {
    const { children, ...rest } = props;
    const id = stageId(children);
    return (
      <h3 className={headingClass.h3} {...rest} id={id} data-stage={id}>
        {children}
      </h3>
    );
  },
  h3: (props) => {
    const { children, ...rest } = props;
    const id = stageId(children);
    return (
      <h4 className={headingClass.h4} {...rest} id={id} data-stage={id}>
        {children}
      </h4>
    );
  },
  p: (props) => <p className="mt-3 leading-relaxed" {...props} />,
  ul: (props) => <ul className="mt-3 list-disc space-y-1 pl-5" {...props} />,
  ol: (props) => <ol className="mt-3 list-decimal space-y-1 pl-5" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  strong: (props) => <strong className="font-semibold" {...props} />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
