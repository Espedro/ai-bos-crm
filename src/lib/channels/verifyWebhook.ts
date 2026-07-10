/**
 * Meta's webhook verification handshake: on GET, it sends hub.mode,
 * hub.verify_token, and hub.challenge as query params and expects the
 * challenge echoed back as plain text if the token matches what the
 * client configured for this connection.
 */
export function handleWebhookVerification(request: Request, expectedToken: string): Response {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === expectedToken && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}
