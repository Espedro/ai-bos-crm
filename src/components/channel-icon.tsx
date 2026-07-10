import { MessageCircle, MessageSquare, Camera, Mail, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const CHANNEL_CONFIG: Record<string, { icon: typeof MessageCircle; classes: string }> = {
  WHATSAPP: { icon: MessageCircle, classes: "bg-emerald-100 text-emerald-700" },
  FACEBOOK: { icon: MessageSquare, classes: "bg-blue-100 text-blue-700" },
  INSTAGRAM: { icon: Camera, classes: "bg-fuchsia-100 text-fuchsia-700" },
  EMAIL: { icon: Mail, classes: "bg-slate-100 text-slate-700" },
  WEBCHAT: { icon: Globe, classes: "bg-sky-100 text-sky-700" },
};

export function ChannelIcon({
  channel,
  className,
}: {
  channel: string;
  className?: string;
}) {
  const config = CHANNEL_CONFIG[channel] ?? CHANNEL_CONFIG.WEBCHAT;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full",
        config.classes,
        className
      )}
    >
      <Icon className="size-3.5" />
    </div>
  );
}
