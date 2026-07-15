import { cn } from "@/lib/utils";

export function InboxShell({
  list,
  children,
  context,
  hasActive = false,
}: {
  list: React.ReactNode;
  children: React.ReactNode;
  context?: React.ReactNode;
  hasActive?: boolean;
}) {
  return (
    <div className="flex h-[calc(100vh-5.5rem)] overflow-hidden border border-border bg-card sm:h-[calc(100vh-6.5rem)] lg:h-[calc(100vh-4rem)]">
      <div
        className={cn(
          "w-full shrink-0 flex-col border-r sm:w-[340px]",
          hasActive ? "hidden sm:flex" : "flex"
        )}
      >
        {list}
      </div>
      <div
        className={cn(
          "min-w-0 flex-1 flex-col",
          hasActive ? "flex" : "hidden sm:flex"
        )}
      >
        {children}
      </div>
      {context && (
        <div className="hidden w-[300px] shrink-0 flex-col overflow-y-auto border-l xl:flex">
          {context}
        </div>
      )}
    </div>
  );
}
