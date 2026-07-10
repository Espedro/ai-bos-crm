"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { connectWhatsAppEmbeddedSignup } from "@/lib/actions/channels";

declare global {
  interface Window {
    FB?: {
      init: (options: { appId: string; version: string; xfbml?: boolean }) => void;
      login: (
        callback: (response: { authResponse?: { code?: string } }) => void,
        options: Record<string, unknown>
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

type SignupSessionData = { phone_number_id: string; waba_id: string };

function loadFacebookSdk(appId: string): Promise<void> {
  return new Promise((resolve) => {
    if (window.FB) {
      resolve();
      return;
    }
    window.fbAsyncInit = () => {
      window.FB!.init({ appId, version: "v22.0" });
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    document.body.appendChild(script);
  });
}

/**
 * Meta's WhatsApp Embedded Signup: the customer authorizes their own WABA
 * in a popup (no Meta Developer app of their own required), we get the
 * code + WABA/phone IDs back and exchange them server-side.
 */
export function WhatsAppEmbeddedSignupButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const sessionDataRef = useRef<SignupSessionData | null>(null);
  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  const configId = process.env.NEXT_PUBLIC_FACEBOOK_WHATSAPP_CONFIG_ID;

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!event.origin.endsWith("facebook.com")) return;
      console.log("[WhatsApp Embedded Signup] postMessage from Meta:", event.data);
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data?.type !== "WA_EMBEDDED_SIGNUP") return;
        if (data.data?.phone_number_id || data.data?.waba_id) {
          sessionDataRef.current = {
            phone_number_id: data.data.phone_number_id ?? "",
            waba_id: data.data.waba_id ?? "",
          };
        }
      } catch {
        // Not a JSON message we care about.
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  if (!appId || !configId) {
    return (
      <p className="text-xs text-muted-foreground">
        WhatsApp Embedded Signup isn&apos;t configured yet.
      </p>
    );
  }

  function handleClick() {
    setError(null);
    startTransition(async () => {
      await loadFacebookSdk(appId!);
      window.FB!.login(
        (response) => {
          const code = response.authResponse?.code;
          if (!code) {
            setError("Signup was cancelled or didn't complete.");
            return;
          }
          startTransition(async () => {
            // sessionData arrives via the postMessage listener, which can
            // land slightly before or after this callback fires.
            const data = sessionDataRef.current ?? (await waitForSessionData());
            if (!data) {
              setError("Didn't receive WhatsApp account details. Please try again.");
              return;
            }
            const result = await connectWhatsAppEmbeddedSignup(code, data.waba_id, data.phone_number_id);
            if (result?.error) setError(result.error);
          });
        },
        {
          config_id: configId,
          response_type: "code",
          override_default_response_type: true,
          extras: { setup: {} },
        }
      );
    });
  }

  function waitForSessionData(): Promise<SignupSessionData | null> {
    return new Promise((resolve) => {
      const start = Date.now();
      const interval = setInterval(() => {
        if (sessionDataRef.current) {
          clearInterval(interval);
          resolve(sessionDataRef.current);
        } else if (Date.now() - start > 15000) {
          clearInterval(interval);
          resolve(null);
        }
      }, 200);
    });
  }

  return (
    <div className="space-y-2">
      <Button type="button" className="w-full" disabled={isPending} onClick={handleClick}>
        {isPending ? "Connecting…" : "Continue with Facebook"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
