import type { MDXComponents } from "mdx/types";

const components: MDXComponents = {
  h1: (props) => (
    <h1 className="mt-10 text-2xl font-semibold tracking-tight" {...props} />
  ),
  h2: (props) => (
    <h2 className="mt-8 text-xl font-semibold tracking-tight" {...props} />
  ),
  h3: (props) => (
    <h3 className="mt-6 text-lg font-semibold tracking-tight" {...props} />
  ),
  p: (props) => <div className="mt-3 leading-relaxed" {...props} />,
  ul: (props) => <ul className="mt-3 list-disc space-y-1 pl-5" {...props} />,
  ol: (props) => <ol className="mt-3 list-decimal space-y-1 pl-5" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  strong: (props) => <strong className="font-semibold" {...props} />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
