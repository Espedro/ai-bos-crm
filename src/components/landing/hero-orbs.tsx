/** Decorative blurred gradient orbs drifting behind the hero — pure CSS keyframes, no JS. */
export function HeroOrbs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-32 left-[15%] size-[420px] rounded-full bg-primary/25 blur-3xl motion-safe:animate-[blob-float_18s_ease-in-out_infinite]" />
      <div className="absolute top-0 right-[12%] size-[360px] rounded-full bg-[oklch(0.72_0.14_320)]/20 blur-3xl motion-safe:animate-[blob-float_22s_ease-in-out_infinite_reverse]" />
      <div className="absolute top-40 left-1/2 size-[300px] -translate-x-1/2 rounded-full bg-[oklch(0.75_0.13_200)]/15 blur-3xl motion-safe:animate-[blob-float_25s_ease-in-out_infinite]" />
    </div>
  );
}
