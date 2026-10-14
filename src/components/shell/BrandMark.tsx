interface BrandMarkProps {
  className?: string;
  /** Draw the satellite in the ink colour instead of the accent */
  mono?: boolean;
  title?: string;
}

/**
 * The RAWIN mark: an "R" built from a stem, a full orbital ring as its bowl and a straight
 * leg, with a single satellite just outside the ring. Monoline on a 32-unit grid with
 * 3-unit strokes so it holds at 16px. Ink is currentColor (theme-native); the satellite
 * takes the accent. Mirrors public/brand/rawin-mark*.svg and the favicon set.
 */
export default function BrandMark({ className = "", mono = false, title }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="none"
    >
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 26.5V5.5" />
        <circle cx="15" cy="12" r="6.5" />
        <path d="M14.6 18.5L23.5 26.5" />
      </g>
      <circle cx="23.8" cy="4.8" r="2.2" fill={mono ? "currentColor" : "var(--accent)"} />
    </svg>
  );
}
