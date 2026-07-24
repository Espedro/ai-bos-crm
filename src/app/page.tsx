import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Bot,
  Inbox,
  KanbanSquare,
  ClipboardList,
  Send,
  ShieldCheck,
} from "lucide-react";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import {
  WhatsAppGlyph,
  MessengerGlyph,
  InstagramGlyph,
} from "@/components/brand-icons";
import { LandingNav } from "@/components/landing/landing-nav";
import { HeroOrbs } from "@/components/landing/hero-orbs";
import { Reveal } from "@/components/landing/reveal";
import { ProductPreview } from "@/components/landing/product-preview";

const FEATURES = [
  {
    icon: Bot,
    title: "AI Employee, always on",
    body: "A trained AI agent answers WhatsApp, Messenger, and Instagram the moment a message comes in — day or night — and hands off to a human only when it should.",
  },
  {
    icon: Inbox,
    title: "One inbox, every channel",
    body: "Every conversation lands in a single unified inbox, tagged by channel, so your team never has to juggle four different apps to talk to one customer.",
  },
  {
    icon: KanbanSquare,
    title: "Pipeline that runs itself",
    body: "Leads become contacts, contacts become deals, deals move through stages — tracked automatically as the AI and your team work the conversation.",
  },
  {
    icon: ClipboardList,
    title: "Forms that feed the CRM",
    body: "Embed a lead-capture form anywhere. Every submission drops straight into your pipeline with no manual entry.",
  },
  {
    icon: Send,
    title: "Campaigns on demand",
    body: "Reach your contact list with targeted email campaigns, straight from the same CRM your team already lives in.",
  },
  {
    icon: ShieldCheck,
    title: "A human in the loop",
    body: "Escalations, overdue tasks, and stale deals surface automatically — so nothing important gets left to the AI alone.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Connect your channels",
    body: "Link WhatsApp, Messenger, and Instagram in a few minutes.",
  },
  {
    n: "02",
    title: "Teach your AI Employee",
    body: "Add your products, services, and policies as Business Resources.",
  },
  {
    n: "03",
    title: "Let it work",
    body: "The AI answers, qualifies, and escalates — your team just closes.",
  },
];

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <LandingNav />

      <main className="flex-1">
        <section className="relative flex flex-col items-center gap-6 overflow-hidden px-6 pt-20 pb-16 text-center sm:pt-28 sm:pb-24">
          <HeroOrbs />
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-6">
            <Reveal>
              <p className="text-xs font-bold tracking-wide text-primary uppercase">
                AI Business Operating System
              </p>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="max-w-3xl text-4xl leading-tight font-extrabold tracking-tight text-balance sm:text-6xl">
                The CRM that{" "}
                <span className="bg-gradient-to-r from-primary via-[oklch(0.62_0.19_300)] to-primary bg-[length:200%_auto] bg-clip-text text-transparent motion-safe:animate-[gradient-shift_6s_ease-in-out_infinite]">
                  answers your customers
                </span>{" "}
                before you do
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="max-w-2xl text-lg text-muted-foreground text-balance">
                AI BOS CRM puts an AI Employee in your inbox, your pipeline, and
                your follow-ups — so leads get a reply in seconds and your team
                only steps in where it counts.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                <Button
                  render={<Link href="/signup" />}
                  nativeButton={false}
                  size="lg"
                  className="h-11 px-6 text-base transition-transform duration-200 hover:-translate-y-0.5"
                >
                  Start free
                  <ArrowRight />
                </Button>
                <Button
                  render={<Link href="/login" />}
                  nativeButton={false}
                  variant="outline"
                  size="lg"
                  className="h-11 px-6 text-base transition-transform duration-200 hover:-translate-y-0.5"
                >
                  Log in to your workspace
                </Button>
              </div>
            </Reveal>

            <Reveal delay={320}>
              <div className="mt-10 flex items-center justify-center gap-6 text-muted-foreground">
                <span className="inline-block motion-safe:animate-[float-y_3s_ease-in-out_infinite]">
                  <WhatsAppGlyph className="size-7" />
                </span>
                <span
                  className="inline-block motion-safe:animate-[float-y_3s_ease-in-out_infinite]"
                  style={{ animationDelay: "0.3s" }}
                >
                  <MessengerGlyph className="size-7" />
                </span>
                <span
                  className="inline-block motion-safe:animate-[float-y_3s_ease-in-out_infinite]"
                  style={{ animationDelay: "0.6s" }}
                >
                  <InstagramGlyph className="size-7" />
                </span>
              </div>
              <p className="mt-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Where your customers already message you
              </p>
            </Reveal>

            <Reveal delay={420} className="mt-14 w-full max-w-3xl">
              <ProductPreview />
            </Reveal>
          </div>
        </section>

        <section className="border-t bg-card/40">
          <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
            <Reveal className="max-w-2xl">
              <p className="text-xs font-bold tracking-wide text-primary uppercase">
                What you get
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Everything a growing team needs to run sales on autopilot
              </h2>
            </Reveal>
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }, i) => (
                <Reveal key={title} delay={i * 80}>
                  <div className="group h-full border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                    <div className="flex size-9 items-center justify-center border border-primary/30 bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-4 text-base font-bold tracking-tight">
                      {title}
                    </h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t">
          <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
            <Reveal className="max-w-2xl">
              <p className="text-xs font-bold tracking-wide text-primary uppercase">
                How it works
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Live in an afternoon
              </h2>
            </Reveal>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <Reveal key={step.n} delay={i * 100}>
                  <div className="border-l-2 border-primary pl-4">
                    <p className="font-mono text-sm font-bold text-primary">
                      {step.n}
                    </p>
                    <h3 className="mt-2 text-base font-bold tracking-tight">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t bg-primary/5">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 px-6 py-16 text-center sm:py-20">
            <Reveal className="flex flex-col items-center gap-5">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to stop losing leads to slow replies?
              </h2>
              <p className="max-w-xl text-muted-foreground">
                Set up your workspace now — no credit card, no waiting on a
                sales call.
              </p>
              <Button
                render={<Link href="/signup" />}
                nativeButton={false}
                size="lg"
                className="h-11 px-6 text-base transition-transform duration-200 hover:-translate-y-0.5"
              >
                Create your workspace
                <ArrowRight />
              </Button>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t px-6 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} AI BOS CRM. All rights reserved.
      </footer>
    </div>
  );
}
