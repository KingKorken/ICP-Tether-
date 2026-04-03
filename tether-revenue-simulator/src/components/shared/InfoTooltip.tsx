"use client";

import { useState, useRef, useEffect } from "react";

interface InfoTooltipProps {
  content: string;
  disclaimer?: string;
  className?: string;
}

export function InfoTooltip({ content, disclaimer, className = "" }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full border border-current opacity-40 hover:opacity-70 transition-opacity cursor-pointer flex-shrink-0"
        aria-label="More information"
        type="button"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 0.5C4.4 0.5 3.9 1 3.9 1.6C3.9 2.2 4.4 2.7 5 2.7C5.6 2.7 6.1 2.2 6.1 1.6C6.1 1 5.6 0.5 5 0.5ZM5.8 9.5V3.8H4.2V9.5H5.8Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={tooltipRef}
          className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-brand-surface rounded-lg border border-brand-border/80 p-4 text-left shadow-sm"
        >
          {/* Arrow pointing up */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[-1px]">
            <div className="w-3 h-3 bg-brand-surface border-l border-t border-brand-border/80 transform rotate-45 translate-y-1.5" />
          </div>
          <p className="text-sm text-brand-text leading-relaxed">{content}</p>
          {disclaimer && (
            <p className="text-xs text-brand-muted mt-2 pt-2 border-t border-brand-border/40 italic">
              {disclaimer}
            </p>
          )}
        </div>
      )}
    </span>
  );
}
