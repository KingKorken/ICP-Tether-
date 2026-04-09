/**
 * TetherLogo — the official Tether mark.
 *
 * A mint/aqua circular arc (~270°, open at the upper-right) wrapped
 * around a lightning bolt. Rendered as SVG so it stays crisp on retina,
 * scales with font-size via `size`, and themes via `className` / color.
 */
interface TetherLogoProps {
  /** Pixel size (width == height). Defaults to 32. */
  size?: number;
  /** Optional extra classes (e.g. color via text-*). */
  className?: string;
  /** Accessible label. Pass empty string for purely decorative use. */
  title?: string;
}

export function TetherLogo({
  size = 32,
  className,
  title = "Tether",
}: TetherLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={title ? "img" : "presentation"}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {/*
        Open circular arc — starts just above 3 o'clock, sweeps
        counter-clockwise all the way around to ~1 o'clock, leaving
        a gap at the top-right where the bolt exits the circle.
      */}
      <path
        d="M47 14.5 A22 22 0 1 0 53 30"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {/*
        Lightning bolt — centered inside the circle, slight right-lean.
        Drawn as a closed filled polygon for a solid silhouette.
      */}
      <path
        d="M35 16 L22 36 L30 36 L27 50 L42 28 L33 28 L37 16 Z"
        fill="currentColor"
      />
    </svg>
  );
}
