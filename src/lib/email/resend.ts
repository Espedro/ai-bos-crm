import { Resend } from "resend";

let client: Resend | null = null;

function getResendClient(): Resend {
  if (!client) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}

const RESEND_TEST_SENDER = "onboarding@resend.dev";

/**
 * Resolves the "From" header for outbound campaign email. Businesses that
 * haven't verified their own domain in their own Resend account yet fall
 * back to Resend's shared test sender rather than failing outright.
 */
export function resolveFromAddress(
  emailFromName: string | null | undefined,
  emailFromAddress: string | null | undefined
): string {
  const address = emailFromAddress?.trim() || RESEND_TEST_SENDER;
  const name = emailFromName?.trim();
  return name ? `${name} <${address}>` : address;
}

export async function sendCampaignEmail(params: {
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<{ id: string }> {
  const resend = getResendClient();
  const { data, error } = await resend.emails.send({
    from: params.from,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error("Resend returned no message id");
  }
  return { id: data.id };
}
