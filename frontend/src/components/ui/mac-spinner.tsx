import React from "react";
import { cn } from "@/lib/utils";

export interface MacSpinnerProps extends React.SVGProps<SVGSVGElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  className?: string;
  stepped?: boolean;
}

const sizeClasses: Record<string, string> = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-7 h-7",
  xl: "w-10 h-10",
};

export const MacSpinner: React.FC<MacSpinnerProps> = ({
  size = "sm",
  className,
  stepped = true,
  style,
  ...props
}) => {
  const isNamedSize = typeof size === "string" && size in sizeClasses;
  const sizeClass = isNamedSize ? sizeClasses[size as string] : "";
  const customStyle =
    typeof size === "number"
      ? { width: size, height: size, ...style }
      : style;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "shrink-0 text-current",
        sizeClass,
        stepped ? "animate-mac-spinner" : "animate-spin",
        className
      )}
      style={customStyle}
      aria-hidden="true"
      {...props}
    >
      {/* 12 macOS-style spokes at 30° increments with descending opacities */}
      <line x1="12" y1="2.2" x2="12" y2="5.8" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" opacity="1.0" />
      <line x1="12" y1="2.2" x2="12" y2="5.8" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" opacity="0.92" transform="rotate(30 12 12)" />
      <line x1="12" y1="2.2" x2="12" y2="5.8" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" opacity="0.84" transform="rotate(60 12 12)" />
      <line x1="12" y1="2.2" x2="12" y2="5.8" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" opacity="0.75" transform="rotate(90 12 12)" />
      <line x1="12" y1="2.2" x2="12" y2="5.8" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" opacity="0.67" transform="rotate(120 12 12)" />
      <line x1="12" y1="2.2" x2="12" y2="5.8" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" opacity="0.58" transform="rotate(150 12 12)" />
      <line x1="12" y1="2.2" x2="12" y2="5.8" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" opacity="0.50" transform="rotate(180 12 12)" />
      <line x1="12" y1="2.2" x2="12" y2="5.8" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" opacity="0.42" transform="rotate(210 12 12)" />
      <line x1="12" y1="2.2" x2="12" y2="5.8" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" opacity="0.33" transform="rotate(240 12 12)" />
      <line x1="12" y1="2.2" x2="12" y2="5.8" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" opacity="0.25" transform="rotate(270 12 12)" />
      <line x1="12" y1="2.2" x2="12" y2="5.8" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" opacity="0.17" transform="rotate(300 12 12)" />
      <line x1="12" y1="2.2" x2="12" y2="5.8" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" opacity="0.08" transform="rotate(330 12 12)" />
    </svg>
  );
};

export const PageLoader: React.FC<{ text?: string }> = ({
  text = "Loading...",
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-md transition-all">
      <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-card/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-2xl backdrop-blur-xl">
        <MacSpinner size="xl" className="text-emerald-600 dark:text-emerald-400" />
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {text}
        </span>
      </div>
    </div>
  );
};

export default MacSpinner;
