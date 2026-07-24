"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex items-center justify-between border-b px-6 py-4 backdrop-blur-sm transition-all duration-300 sm:px-10",
        scrolled ? "border-border bg-background/95 shadow-sm" : "border-transparent bg-transparent"
      )}
    >
      <p className="text-xl leading-tight font-extrabold tracking-tight">
        <span className="text-primary">AI</span> BOS
      </p>
      <div className="flex items-center gap-2">
        <Button render={<Link href="/login" />} nativeButton={false} variant="ghost">
          Log in
        </Button>
        <Button render={<Link href="/signup" />} nativeButton={false}>
          Get started
          <ArrowRight />
        </Button>
      </div>
    </header>
  );
}
