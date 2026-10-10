"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Standings" },
  { href: "/divisions", label: "Divisions" },
  { href: "/faceoffs", label: "Faceoffs" },
  { href: "/players", label: "Players" },
  { href: "/rules", label: "Rules" },
  { href: "/crew", label: "Draft Room" },
] as const;

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="-mx-1 flex basis-full [scrollbar-width:none] gap-1 overflow-x-auto sm:flex-1 sm:basis-auto sm:justify-end sm:overflow-visible"
    >
      {LINKS.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`relative shrink-0 skew-x-[-12deg] px-2.5 py-1.5 text-[13px] font-bold tracking-wider whitespace-nowrap uppercase transition-colors sm:px-3 sm:text-base ${
              active
                ? "bg-red-line text-white shadow-[3px_3px_0_0_#000]"
                : "text-white/75 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span className="inline-block skew-x-[12deg]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
