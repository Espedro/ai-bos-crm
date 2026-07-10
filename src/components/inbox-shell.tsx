export function InboxShell({
  list,
  children,
}: {
  list: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex w-[340px] shrink-0 flex-col border-r">{list}</div>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
