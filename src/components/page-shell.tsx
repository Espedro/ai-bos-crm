export function PageShell({
  kicker,
  title,
  actions,
  children,
  contentClassName,
}: {
  kicker: string;
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
}) {
  return (
    <>
      {/* Negative margins cancel the ambient layout padding (pt-7 pr-8 pl-8)
          so the topbar sits flush and full-bleed, matching the reference —
          px-8 restores the same inset for its own content. */}
      <header className="sticky top-0 z-10 -mt-7 -mr-8 -ml-8 flex min-h-[70px] flex-wrap items-center justify-between gap-4 border-b bg-background/95 px-8 py-3 backdrop-blur-sm">
        <div>
          <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{kicker}</p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight">{title}</h1>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className={contentClassName ?? "pt-7"}>{children}</div>
    </>
  );
}
