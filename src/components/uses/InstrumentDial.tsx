import type { CSSProperties } from "react";

const C = 200;

function polar(r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)] as const;
}

function arc(r: number, a0: number, a1: number) {
  const [x0, y0] = polar(r, a0);
  const [x1, y1] = polar(r, a1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

/** One arc segment per entry, so the rings always describe the real content. */
function segments(n: number, r: number, gap: number) {
  if (n <= 0) return [];
  if (n === 1) return [arc(r, 0, 359.9)];
  const step = 360 / n;
  return Array.from({ length: n }, (_, i) => arc(r, i * step + gap / 2, (i + 1) * step - gap / 2));
}

/**
 * The hero's instrument plate: a calibrated dial whose inner rings carry one segment per
 * everyday instrument and one per stack entry. Decorative (the same numbers are stated in
 * text beside it), so it is hidden from assistive technology.
 */
export default function InstrumentDial({ instruments, stack, total }: { instruments: number; stack: number; total: number }) {
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);
  return (
    <div className="uses-dial" aria-hidden="true">
      {/* one round body for the particle field: the plate and its ring of ticks */}
      <svg viewBox="0 0 400 400" className="uses-dial-svg" data-field-surface="disc">
        <circle className="uses-dial-halo" cx={C} cy={C} r="178" />
        <g className="uses-dial-ticks">
          {ticks.map((deg) => {
            const major = deg % 45 === 0;
            const [x0, y0] = polar(major ? 186 : 190, deg);
            const [x1, y1] = polar(196, deg);
            return <line key={deg} className={major ? "is-major" : undefined} x1={x0} y1={y0} x2={x1} y2={y1} />;
          })}
        </g>
        <circle className="uses-dial-guide" cx={C} cy={C} r="160" />
        {segments(instruments, 160, 6).map((d, i) => (
          <path key={`a${i}`} className="uses-dial-seg is-lav" d={d} style={{ "--i": i } as CSSProperties} />
        ))}
        <circle className="uses-dial-guide" cx={C} cy={C} r="132" />
        {segments(stack, 132, 5).map((d, i) => (
          <path key={`b${i}`} className="uses-dial-seg is-peri" d={d} style={{ "--i": i + instruments } as CSSProperties} />
        ))}
        <circle className="uses-dial-guide is-faint" cx={C} cy={C} r="104" />
        <g className="uses-dial-sweep">
          <line x1={C} y1={C} x2={C} y2="44" />
          <circle cx={C} cy="44" r="2.5" />
        </g>
        <path className="uses-dial-mark" d={`M${C} 6 L${C} 22`} />
        <text className="uses-dial-num" x={C} y="212" textAnchor="middle">
          {String(total).padStart(2, "0")}
        </text>
        <text className="uses-dial-cap" x={C} y="240" textAnchor="middle">
          indexed
        </text>
      </svg>
      <ul className="uses-dial-legend label-mono">
        <li>
          <span className="uses-dial-key is-lav" />
          Outer ring · one mark per instrument
        </li>
        <li>
          <span className="uses-dial-key is-peri" />
          Inner ring · one mark per stack entry
        </li>
      </ul>
    </div>
  );
}
