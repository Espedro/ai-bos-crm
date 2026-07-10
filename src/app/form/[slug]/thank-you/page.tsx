import { CheckCircle2 } from "lucide-react";

export default function FormThankYouPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center gap-3 px-6 text-center">
      <CheckCircle2 className="size-10 text-primary" />
      <h1 className="text-2xl font-bold tracking-tight">Thanks!</h1>
      <p className="text-sm text-muted-foreground">
        Your submission was received. We&apos;ll be in touch soon.
      </p>
    </div>
  );
}
