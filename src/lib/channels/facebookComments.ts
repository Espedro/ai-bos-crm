import type { ChannelConnection } from "@prisma/client";

const GRAPH_API_VERSION = "v22.0";

export type ParsedComment = {
  /**
   * Meta's Page-object Webhooks product only supports ONE callback URL per
   * app — every Page subscribed to this app delivers here, regardless of
   * which business connected it. `recipientId` is the Page ID from
   * `entry[].id`, which the webhook route uses to look up the right
   * business's ChannelConnection instead of trusting the URL's
   * connectionId segment.
   */
  recipientId: string;
  externalCommentId: string;
  postId?: string;
  commenterId?: string;
  commenterName?: string;
  commentText: string;
};

/**
 * Parses a Facebook Page "feed" webhook payload (new comment on a post).
 * Returns null for anything that isn't a newly-added comment (edits,
 * deletes, reactions, etc. arrive on the same `feed` field).
 */
export function parseFacebookCommentWebhook(body: unknown): ParsedComment | null {
  const entry = (body as { entry?: unknown[] })?.entry?.[0] as
    | { id?: string; changes?: unknown[] }
    | undefined;

  const change = entry?.changes?.find(
    (c) => (c as { field?: string })?.field === "feed"
  ) as
    | {
        value?: {
          item?: string;
          verb?: string;
          comment_id?: string;
          post_id?: string;
          message?: string;
          from?: { id?: string; name?: string };
        };
      }
    | undefined;

  const value = change?.value;

  if (
    !entry?.id ||
    !value ||
    value.item !== "comment" ||
    value.verb !== "add" ||
    !value.comment_id ||
    !value.message
  ) {
    return null;
  }

  return {
    recipientId: entry.id,
    externalCommentId: value.comment_id,
    postId: value.post_id,
    commenterId: value.from?.id,
    commenterName: value.from?.name,
    commentText: value.message,
  };
}

export async function sendPublicCommentReply(
  connection: ChannelConnection,
  commentId: string,
  text: string
): Promise<void> {
  if (!connection.accessToken) {
    throw new Error("Connection is missing an access token");
  }

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${commentId}/comments?access_token=${encodeURIComponent(
      connection.accessToken
    )}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Comment reply failed (${response.status}): ${errorBody}`);
  }
}
