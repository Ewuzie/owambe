import { CSSProperties, ReactNode } from "react";
import { OwambeEvent } from "@/lib/event";

/*
  Wears the celebration's aso-ebi colour.

  The design uses exactly one accent, and this is where it is set. Every
  descendant reading var(--accent) recolours automatically, so the whole
  page changes clothes per event without a single conditional.
*/
export function AccentScope({
  event,
  children,
  className,
}: {
  event: OwambeEvent;
  children: ReactNode;
  className?: string;
}) {
  const style = {
    "--accent": event.accent,
    "--accent-deep": event.accentDeep,
  } as CSSProperties;

  return (
    <div style={style} className={className}>
      {children}
    </div>
  );
}
