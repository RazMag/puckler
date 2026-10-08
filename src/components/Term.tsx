import type { ReactNode } from "react";
import { GLOSSARY, type GlossaryKey } from "@/lib/glossary";
import { Tooltip } from "./Tooltip";

/** A piece of hockey jargon with its glossary explanation on hover, focus or tap. */
export function Term({
  term,
  children,
  underline,
  className,
}: {
  term: GlossaryKey;
  children: ReactNode;
  underline?: boolean;
  className?: string;
}) {
  const { title, text } = GLOSSARY[term];
  return (
    <Tooltip title={title} text={text} underline={underline} className={className}>
      {children}
    </Tooltip>
  );
}
