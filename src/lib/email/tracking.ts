/**
 * Rewrites campaign HTML so opens and clicks are attributable to a specific
 * CampaignRecipient without exposing their identity in the URL — both
 * tracking routes are keyed by the recipient's opaque trackingToken.
 */
export function injectTracking(html: string, trackingToken: string, origin: string): string {
  const withTrackedLinks = html.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (_match, url: string) =>
      `href="${origin}/api/track/click/${trackingToken}?url=${encodeURIComponent(url)}"`
  );

  const pixel = `<img src="${origin}/api/track/open/${trackingToken}" width="1" height="1" alt="" style="display:none" />`;
  return `${withTrackedLinks}${pixel}`;
}
