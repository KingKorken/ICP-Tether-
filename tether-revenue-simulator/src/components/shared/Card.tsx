import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

const paddingStyles = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({
  children,
  className = "",
  padding = "md",
}: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-xl shadow-sm border border-brand-secondary/50
        ${paddingStyles[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
