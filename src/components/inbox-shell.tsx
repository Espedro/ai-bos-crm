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
    <div className="flex h-[calc(100vh-124px)] overflow-hidden border border-border bg-card shadow-sm lg:h-[calc(100vh-68px)]">
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
