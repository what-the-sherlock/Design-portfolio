// Pixel icons drawn on a 56×56 grid (same construction as the original's inline SVGs).

type P = { className?: string };
const C = "var(--color-primary)";

export function PixelAsterisk({ className }: P) {
  return (
    <svg className={className} width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <rect x="26.3" width="3" height="56" fill={C} />
      <rect y="26.5" width="56" height="3" fill={C} />
      {[[32, 20], [28, 24], [24, 28], [20, 32], [16, 36], [12, 40], [8, 44], [8, 8], [12, 12], [16, 16], [20, 20], [24, 24], [28, 28], [32, 32], [36, 36], [40, 40], [44, 44], [36, 16], [40, 12], [44, 8]].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" fill={C} />
      ))}
    </svg>
  );
}

export function PixelCode({ className }: P) {
  return (
    <svg className={className} width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      {[[52, 28], [48, 32], [44, 36], [40, 40], [36, 44], [36, 8], [40, 12], [44, 16], [48, 20], [52, 24], [4, 20], [25, 28], [0, 24], [23, 32], [21, 36], [12, 40], [12, 12], [29, 20], [0, 28], [4, 32], [8, 36], [16, 44], [8, 16], [27, 24], [16, 8], [31, 16]].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" fill={C} />
      ))}
    </svg>
  );
}

/** Outlined pixel play triangle — the "motion" mark. */
export function PixelPlay({ className }: P) {
  const top = [0, 1, 2, 3, 4, 5].map((k) => [14 + 4 * k, 6 + 4 * k]);
  const bottom = [0, 1, 2, 3, 4].map((k) => [14 + 4 * k, 46 - 4 * k]);
  return (
    <svg className={className} width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <rect x="11" y="6" width="3" height="44" fill={C} />
      {[...top, ...bottom].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" fill={C} />
      ))}
    </svg>
  );
}

export function PixelFrame({ className }: P) {
  return (
    <svg className={className} width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="53" height="53" stroke={C} strokeWidth="3" />
      {[[42, 26], [26, 26], [38, 30], [34, 34], [30, 38], [30, 14], [34, 18], [38, 22], [14, 22], [10, 26], [22, 38], [22, 14], [14, 30], [18, 34], [18, 18]].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" fill={C} />
      ))}
    </svg>
  );
}

export function CloseX() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g fill="var(--color-primary)">
        {[[3, 19], [5, 17], [7, 15], [9, 13], [11, 11], [13, 9], [15, 7], [17, 5], [19, 3]].map(([x, y]) => (
          <rect key={`a${x}`} x={x} y={y} width="2" height="2" />
        ))}
        {[[3, 3], [5, 5], [7, 7], [9, 9], [11, 11], [13, 13], [15, 15], [17, 17], [19, 19]].map(([x, y]) => (
          <rect key={`b${x}`} x={x} y={y} width="2" height="2" />
        ))}
      </g>
    </svg>
  );
}

/** Corner-arrow "expand" mark on the Snake tile (paths morph outward on hover via CSS `d`). */
export function ExpandIcon() {
  return (
    <svg className="expand-icon" width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <g opacity="0.4" fill="var(--color-primary)" className="expand-g">
        <path className="path-1" d="M16 48L16.8 40H17.6L18 46L24 46.4V47.2L16 48Z" />
        <path className="path-2" d="M48 16L47.2 24L46.4 24L46 18L40 17.6L40 16.8L48 16Z" />
      </g>
    </svg>
  );
}

export function VolumeIcon({ muted }: { muted: boolean }) {
  const s = { stroke: "var(--color-primary)", strokeWidth: 1.2, strokeLinecap: "round" as const };
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={muted ? "is-muted" : undefined} aria-hidden="true">
      <path {...s} strokeLinejoin="round" d="M5.5 9.9999H4.16667C3.98986 9.9999 3.82029 9.92966 3.69526 9.80464C3.57024 9.67961 3.5 9.51004 3.5 9.33323V6.66657C3.5 6.48976 3.57024 6.32019 3.69526 6.19516C3.82029 6.07014 3.98986 5.9999 4.16667 5.9999H5.5L7.83333 2.9999C7.8916 2.88672 7.98843 2.79812 8.10633 2.7501C8.22422 2.70207 8.3554 2.69781 8.47617 2.73806C8.59693 2.77832 8.69932 2.86044 8.76482 2.96959C8.83032 3.07875 8.85463 3.20773 8.83333 3.33323V12.6666C8.85463 12.7921 8.83032 12.9211 8.76482 13.0302C8.69932 13.1394 8.59693 13.2215 8.47617 13.2617C8.3554 13.302 8.22422 13.2977 8.10633 13.2497C7.98843 13.2017 7.8916 13.1131 7.83333 12.9999L5.5 9.9999Z" />
      <path {...s} strokeLinejoin="round" d="M11.25 5.33325C11.664 5.64374 12 6.04636 12.2314 6.50921C12.4628 6.97206 12.5833 7.48243 12.5833 7.99992C12.5833 8.5174 12.4628 9.02778 12.2314 9.49063C12 9.95348 11.664 10.3561 11.25 10.6666" />
      <path {...s} className="mute-line" d="M2 14L14 2" />
    </svg>
  );
}
