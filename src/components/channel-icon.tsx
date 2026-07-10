import { MessageCircle, MessageSquare, Mail, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

type IconComponent = React.ComponentType<{ className?: string }>;

/**
 * lucide-react dropped brand glyphs — this is a minimal monochrome
 * approximation of the Instagram mark (rounded square + lens + flash dot),
 * sized/stroked to match the lucide icons it sits alongside.
 */
function InstagramGlyph({ className }: { className?: string }) {
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

const CHANNEL_CONFIG: Record<string, { icon: IconComponent; classes: string }> = {
  WHATSAPP: { icon: MessageCircle, classes: "bg-channel-whatsapp text-channel-whatsapp-foreground" },
  FACEBOOK: { icon: MessageSquare, classes: "bg-channel-facebook text-channel-facebook-foreground" },
  INSTAGRAM: { icon: InstagramGlyph, classes: "bg-channel-instagram text-channel-instagram-foreground" },
  EMAIL: { icon: Mail, classes: "bg-channel-email text-channel-email-foreground" },
  WEBCHAT: { icon: Globe, classes: "bg-channel-webchat text-channel-webchat-foreground" },
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
