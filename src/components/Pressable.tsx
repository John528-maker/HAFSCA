import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary: "press press-primary",
  secondary: "press press-secondary",
  ghost: "press press-ghost",
};

export default function Pressable({
  href,
  variant = "primary",
  className = "",
  children,
  type = "button",
  ...props
}: {
  href?: string;
  variant?: Variant;
  children: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = `${variants[variant]} ${className}`.trim();
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} {...props}>
      {children}
    </button>
  );
}
