import { cn } from "@/lib/utils";
import { PHASES, TONE_BADGE, phaseOf, statusLabel, statusTone } from "./vault-format";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[13px] font-medium", TONE_BADGE[statusTone(status)], className)}>
      {statusLabel(status)}
    </span>
  );
}

/** The six deposit stages as a segmented bar; `labels` shows stage names underneath. */
export function PhaseBar({ status, labels = false }: { status: string; labels?: boolean }) {
  const current = phaseOf(status);
  return (
    <ol aria-label="Deposit progress" className={cn("grid grid-cols-6", labels ? "gap-2" : "gap-1")}>
      {PHASES.map((phase, i) => {
        const done = current >= 0 && i < current;
        const now = i === current;
        return (
          <li key={phase} className="min-w-0">
            <span aria-hidden className={cn("block rounded-full", labels ? "h-1" : "h-[3px]", done || now ? "bg-signal" : "bg-line")} />
            <span className={cn(labels ? "mt-2 block truncate text-[13px]" : "sr-only", now ? "font-medium text-ink" : done ? "text-ink-2" : "text-ink-3")}>
              {phase}
              <span className="sr-only">{now ? " (current stage)" : done ? " (done)" : ""}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
