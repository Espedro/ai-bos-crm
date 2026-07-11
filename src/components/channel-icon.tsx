import { Mail, Globe } from "lucide-react";
import { WhatsAppGlyph, MessengerGlyph, InstagramGlyph } from "@/components/brand-icons";
import { cn } from "@/lib/utils";

type IconComponent = React.ComponentType<{ className?: string }>;

const CHANNEL_CONFIG: Record<string, { icon: IconComponent; classes: string }> = {
  WHATSAPP: { icon: WhatsAppGlyph, classes: "bg-channel-whatsapp text-channel-whatsapp-foreground" },
  FACEBOOK: { icon: MessengerGlyph, classes: "bg-channel-facebook text-channel-facebook-foreground" },
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
