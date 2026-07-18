/**
 * Original, simple line-style icons (24x24-ish, centered on their own origin)
 * themed around agriculture, AI, community, and progress — the four things
 * this project is actually about. Deliberately plain geometric strokes, not
 * modeled on any specific existing icon set.
 *
 * Shared by ChatBackgroundPattern (the chat wallpaper texture) and the
 * homepage's feature grid, so the same icon vocabulary/style is reused
 * rather than redrawn twice.
 */
export const LINE_ICONS: Record<string, React.ReactNode> = {
  leaf: (
    <>
      <path d="M-6,8 C-6,-2 2,-9 9,-9 C9,1 1,8 -6,8 Z" />
      <path d="M-6,8 C-2,2 4,-3 9,-9" />
    </>
  ),
  seedling: (
    <>
      <line x1="0" y1="9" x2="0" y2="-2" />
      <path d="M0,-2 C-4,-2 -6,-5 -6,-8 C-2,-8 0,-5 0,-2 Z" />
      <path d="M0,0 C4,0 6,-3 6,-6 C2,-6 0,-3 0,0 Z" />
      <line x1="-5" y1="9" x2="5" y2="9" />
    </>
  ),
  sun: (
    <>
      <circle cx="0" cy="0" r="4" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1={6 * Math.cos((deg * Math.PI) / 180)}
          y1={6 * Math.sin((deg * Math.PI) / 180)}
          x2={9 * Math.cos((deg * Math.PI) / 180)}
          y2={9 * Math.sin((deg * Math.PI) / 180)}
        />
      ))}
    </>
  ),
  cloudRain: (
    <>
      <path d="M-8,-2 C-8,-6 -4,-8 -1,-7 C0,-9 4,-9 5,-6 C8,-6 9,-3 8,-1 C8,1 6,2 4,2 L-6,2 C-8,2 -8,0 -8,-2 Z" />
      <line x1="-4" y1="5" x2="-6" y2="9" />
      <line x1="0" y1="5" x2="-2" y2="9" />
      <line x1="4" y1="5" x2="2" y2="9" />
    </>
  ),
  plantStages: (
    <>
      <line x1="0" y1="9" x2="0" y2="-7" />
      <path d="M0,5 C-3,5 -5,3 -5,1" />
      <path d="M0,5 C3,5 5,3 5,1" />
      <path d="M0,-1 C-3,-1 -5,-3 -5,-5" />
      <path d="M0,-1 C3,-1 5,-3 5,-5" />
      <circle cx="0" cy="-8" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  wheat: (
    <>
      <line x1="0" y1="9" x2="0" y2="-9" />
      <line x1="0" y1="6" x2="-4" y2="4" />
      <line x1="0" y1="6" x2="4" y2="4" />
      <line x1="0" y1="2" x2="-4" y2="0" />
      <line x1="0" y1="2" x2="4" y2="0" />
      <line x1="0" y1="-2" x2="-4" y2="-4" />
      <line x1="0" y1="-2" x2="4" y2="-4" />
    </>
  ),
  wateringCan: (
    <>
      <path d="M-7,3 L-7,-3 C-7,-5 -5,-6 -3,-6 L3,-6 C5,-6 6,-5 6,-3 L6,3 Z" />
      <line x1="6" y1="-4" x2="10" y2="-8" />
      <circle cx="10.5" cy="-9" r="0.8" fill="currentColor" stroke="none" />
      <line x1="-2" y1="-6" x2="-4" y2="-9" />
    </>
  ),
  circuitNode: (
    <>
      <circle cx="-6" cy="-4" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="6" cy="-4" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="0" cy="6" r="1.4" fill="currentColor" stroke="none" />
      <line x1="-6" y1="-4" x2="0" y2="6" />
      <line x1="6" y1="-4" x2="0" y2="6" />
      <line x1="-6" y1="-4" x2="6" y2="-4" />
    </>
  ),
  chatBubble: (
    <>
      <path d="M-9,-6 L9,-6 C10,-6 10,-5 10,-4 L10,3 C10,4 10,4 9,4 L-2,4 L-5,8 L-5,4 L-9,4 C-10,4 -10,4 -10,3 L-10,-4 C-10,-5 -10,-6 -9,-6 Z" />
      <line x1="-6" y1="-1" x2="4" y2="-1" />
      <line x1="-6" y1="1.5" x2="1" y2="1.5" />
    </>
  ),
  lightbulb: (
    <>
      <circle cx="0" cy="-3" r="6" />
      <line x1="-2" y1="3" x2="-2" y2="6" />
      <line x1="2" y1="3" x2="2" y2="6" />
      <line x1="-3" y1="8" x2="3" y2="8" />
      <path d="M-2,-6 L1,-2 L-1,-2 L2,2" />
    </>
  ),
  phone: (
    <>
      <rect x="-4" y="-9" width="8" height="18" rx="2" />
      <line x1="-2" y1="7" x2="2" y2="7" />
      <circle cx="5.5" cy="-7.5" r="2" fill="currentColor" stroke="none" />
    </>
  ),
  person: (
    <>
      <circle cx="0" cy="-5" r="3" />
      <path d="M-6,9 C-6,3 -3,0 0,0 C3,0 6,3 6,9" />
    </>
  ),
  twoHands: (
    <>
      <path d="M-9,3 C-6,-2 -2,-2 0,1" />
      <path d="M9,3 C6,-2 2,-2 0,1" />
    </>
  ),
  handshake: (
    <>
      <path d="M-9,-6 L-1,2" />
      <path d="M9,-6 L1,2" />
      <path d="M-3,0 L-1,2 L1,2 L3,0" />
    </>
  ),
  smiley: (
    <>
      <circle cx="0" cy="0" r="8" />
      <circle cx="-3" cy="-2" r="1" fill="currentColor" stroke="none" />
      <circle cx="3" cy="-2" r="1" fill="currentColor" stroke="none" />
      <path d="M-4,3 C-2,6 2,6 4,3" />
    </>
  ),
  heart: <path d="M0,7 C-6,2 -9,-2 -9,-6 C-9,-9 -6,-9 -4,-7 C-2,-5 0,-3 0,-3 C0,-3 2,-5 4,-7 C6,-9 9,-9 9,-6 C9,-2 6,2 0,7 Z" fill="currentColor" stroke="none" />,
  checkmark: <path d="M-6,0 L-2,5 L7,-6" />,
  arrowUp: (
    <>
      <path d="M-7,6 L-2,1 L2,4 L7,-6" />
      <path d="M1,-6 L7,-6 L7,0" />
    </>
  ),
  calendar: (
    <>
      <rect x="-8" y="-7" width="16" height="14" rx="1.5" />
      <line x1="-8" y1="-3" x2="8" y2="-3" />
      <line x1="-4" y1="-9" x2="-4" y2="-6" />
      <line x1="4" y1="-9" x2="4" y2="-6" />
      <circle cx="-4" cy="1" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="0" cy="1" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="4" cy="1" r="0.8" fill="currentColor" stroke="none" />
    </>
  ),
  clock: (
    <>
      <circle cx="0" cy="0" r="8" />
      <line x1="0" y1="0" x2="0" y2="-5" />
      <line x1="0" y1="0" x2="3" y2="2" />
    </>
  ),
  microphone: (
    <>
      <rect x="-3" y="-9" width="6" height="11" rx="3" />
      <path d="M-6,-1 C-6,4 -3,7 0,7 C3,7 6,4 6,-1" />
      <line x1="0" y1="7" x2="0" y2="10" />
      <line x1="-3.5" y1="10" x2="3.5" y2="10" />
    </>
  ),
  camera: (
    <>
      <path d="M-3,-5 L-2,-8 L2,-8 L3,-5" />
      <rect x="-9" y="-5" width="18" height="13" rx="2" />
      <circle cx="0" cy="1.5" r="4" />
      <circle cx="6" cy="-2" r="0.8" fill="currentColor" stroke="none" />
    </>
  ),
};

export type LineIconName = keyof typeof LINE_ICONS;

/**
 * Renders one icon from LINE_ICONS as a standalone, appropriately-sized SVG —
 * for UI use (e.g. the homepage feature grid), as opposed to
 * ChatBackgroundPattern's use of the same shapes tiled into a background
 * texture. Purely decorative — aria-hidden, pair it with visible text.
 */
export function LineIcon({
  name,
  size = 24,
  strokeWidth = 1.6,
  className,
}: {
  name: LineIconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="-13 -13 26 26"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {LINE_ICONS[name]}
    </svg>
  );
}
