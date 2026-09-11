import "katex/dist/katex.min.css";
import "./katex-a11y.css";
import KatexA11y from "@/components/KatexA11y";

export default function LearnLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <KatexA11y />
      {children}
    </>
  );
}
