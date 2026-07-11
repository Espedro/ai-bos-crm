/**
 * Small monochrome brand glyphs — lucide-react doesn't ship these, so these
 * are minimal line-art approximations sized/stroked to match the lucide
 * icons they sit alongside (same 24x24 viewBox, 2px stroke).
 */

type GlyphProps = { className?: string };

export function WhatsAppGlyph({ className }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3a9 9 0 0 0-7.75 13.5L3 21l4.5-1.25A9 9 0 1 0 12 3Z" />
      <path
        d="M8.6 10.3c.4 3 2.1 4.7 5.1 5.1.8.1 1.5-.6 1.5-1.4 0-.3-.1-.5-.3-.7l-1.1-.9c-.3-.2-.7-.2-1 0l-.4.3a4.2 4.2 0 0 1-1.9-1.9l.3-.4c.2-.3.2-.7 0-1l-.9-1.1a.9.9 0 0 0-.7-.3c-.8 0-1.5.7-1.4 1.5Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export function MessengerGlyph({ className }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 11.5C3 6.8 7 3 12 3s9 3.8 9 8.5-4 8.5-9 8.5c-1 0-2-.1-2.9-.4L5 21l1.2-3.6C4.2 15.9 3 13.8 3 11.5Z" />
      <path
        d="M13 6.5 9 12h2.3l-1 5.5L15 11h-2.5l.5-4.5Z"
        fill="currentColor"
        stroke="none"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InstagramGlyph({ className }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
