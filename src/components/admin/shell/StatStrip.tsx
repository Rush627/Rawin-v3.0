/** Compact ruled metric strip used on admin list screens. */
export default function StatStrip({ stats }: { stats: { label: string; value: number; tone?: "accent" | "success" | "warning" }[] }) {
  const tone = { accent: "text-accent", success: "text-success", warning: "text-warning" } as const;
  return (
    <dl className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line border border-line rounded-[22px] overflow-hidden mb-8 sm:mb-10">
      {stats.map((s) => (
        <div key={s.label} className="bg-surface px-5 py-4 sm:py-5">
          <dt className="label-mono text-fg-subtle flex items-center gap-2">
            {s.tone && <span className={`w-1.5 h-1.5 rounded-full bg-current ${tone[s.tone]}`} />}
            {s.label}
          </dt>
          <dd className="mt-2 font-display text-[2.6rem] leading-none tracking-[-0.02em] text-fg tabular-nums">
            {String(s.value).padStart(2, "0")}
          </dd>
        </div>
      ))}
    </dl>
  );
}
