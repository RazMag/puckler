"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

const GAP = 8;

/**
 * Hover/focus/tap tooltip rendered in the top layer (Popover API), so it isn't
 * clipped by scrolling tables. Positioned above the trigger, or below when
 * there's no room.
 */
export function Tooltip({
  title,
  text,
  children,
  underline = true,
  className = "",
}: {
  title: string;
  text: ReactNode;
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
        className="fixed inset-auto m-0 w-max max-w-64 border-2 border-black bg-boards px-3 py-2 text-left font-sans text-sm leading-snug font-medium tracking-normal text-white normal-case shadow-[4px_4px_0_0_var(--color-red-line)]"
      >
        <span className="block font-display text-xs tracking-wider text-led uppercase">{title}</span>
        {text}
      </span>
    </>
  );
}
