"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";

const GAP = 8;

/**
 * Hover/focus/tap popup rendered in the top layer (Popover API), so it isn't
 * clipped by scrolling tables. Positioned above the trigger, or below when
 * there's no room. `tip` is the popup's content and `tipClassName` its look;
 * `Tooltip` and `TeamTooltip` are the styled versions to reach for.
 */
export function HoverTip({
  tip,
  tipClassName,
  tipStyle,
  children,
  underline = true,
  className = "",
}: {
  tip: ReactNode;
  tipClassName: string;
  tipStyle?: CSSProperties;
  children: ReactNode;
  underline?: boolean;
  className?: string;
}) {
  const id = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const trigger = triggerRef.current;
    const tip = tipRef.current;
    if (!open || !trigger || !tip) return;

    tip.showPopover();
    const anchor = trigger.getBoundingClientRect();
    const box = tip.getBoundingClientRect();
    const left = Math.min(
      Math.max(GAP, anchor.left + anchor.width / 2 - box.width / 2),
      window.innerWidth - box.width - GAP,
    );
    const above = anchor.top - box.height - GAP;
    tip.style.left = `${left}px`;
    tip.style.top = `${above >= GAP ? above : anchor.bottom + GAP}px`;

    // It's pinned to the viewport, so let it go once the page moves.
    const close = () => setOpen(false);
    const closeOutside = (e: PointerEvent) => {
      if (!trigger.contains(e.target as Node)) close();
    };
    window.addEventListener("scroll", close, { capture: true, passive: true, once: true });
    window.addEventListener("resize", close, { once: true });
    document.addEventListener("pointerdown", closeOutside);
    return () => {
      window.removeEventListener("scroll", close, { capture: true });
      window.removeEventListener("resize", close);
      document.removeEventListener("pointerdown", closeOutside);
      if (tip.matches(":popover-open")) tip.hidePopover();
    };
  }, [open]);

  return (
    <>
      <span
        ref={triggerRef}
        tabIndex={0}
        aria-describedby={id}
        // Touch fires leave events right after a tap, so hover only applies to a real mouse.
        // A tap opens it; tapping anywhere else closes it.
        onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className={`cursor-help rounded-sm outline-offset-2 focus-visible:outline-2 focus-visible:outline-blue-line ${
          underline ? "underline decoration-current/50 decoration-dotted decoration-1 underline-offset-[3px]" : ""
        } ${className}`}
      >
        {children}
      </span>
      <span
        ref={tipRef}
        id={id}
        role="tooltip"
        popover="manual"
        // Reset what it would otherwise inherit from the trigger's row (truncate, uppercase, tracking).
        className={`fixed inset-auto m-0 w-max text-left font-sans leading-snug tracking-normal whitespace-normal normal-case ${tipClassName}`}
        style={tipStyle}
      >
        {tip}
      </span>
    </>
  );
}

/** A piece of explanatory text on hover, focus or tap, styled as a jumbotron card. */
export function Tooltip({
  title,
  text,
  ...trigger
}: {
  title: string;
  text: ReactNode;
  children: ReactNode;
  underline?: boolean;
  className?: string;
}) {
  return (
    <HoverTip
      {...trigger}
      tipClassName="max-w-64 border-2 border-black bg-boards px-3 py-2 text-sm font-medium text-white shadow-[4px_4px_0_0_var(--color-red-line)]"
      tip={
        <>
          <span className="block font-display text-xs tracking-wider text-led uppercase">{title}</span>
          {text}
        </>
      }
    />
  );
}
