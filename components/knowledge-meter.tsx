import { cn } from "@/lib/utils";

const RADIUS = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function KnowledgeMeter({
  value,
  word,
}: {
  value: number;
  word: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);
  const tone =
    clamped === 0
      ? "text-muted-foreground"
      : clamped < 35
        ? "text-rose-700"
        : clamped < 70
          ? "text-amber-800"
          : "text-emerald-800";

  return (
    <div
      className={cn("relative size-12 shrink-0", tone)}
      aria-label={`${word} is ${clamped}% known`}
    >
      <svg viewBox="0 0 40 40" className="size-12 -rotate-90" aria-hidden>
        <circle
          cx="20"
          cy="20"
          r={RADIUS}
          fill="none"
          className="stroke-foreground/10"
          strokeWidth="3.5"
        />
        <circle
          cx="20"
          cy="20"
          r={RADIUS}
          fill="none"
          className="stroke-current"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[11px] font-semibold tabular-nums">
        {clamped}%
      </span>
    </div>
  );
}
