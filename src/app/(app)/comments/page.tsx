import { getCommentReplies } from "@/lib/actions/commentReplies";
import { Card, CardContent } from "@/components/ui/card";
import { ChannelIcon } from "@/components/channel-icon";
import { EntityAvatar } from "@/components/entity-avatar";
import { formatDistanceToNow } from "date-fns";

export default async function CommentsPage() {
  const comments = await getCommentReplies();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Public Comments</h1>
        <p className="text-sm text-muted-foreground">
          Comments the AI Employee replied to publicly, nudging commenters to DM instead.
        </p>
      </div>

      <div className="space-y-3">
        {comments.map((comment) => (
          <Card key={comment.id}>
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative shrink-0">
                    <EntityAvatar name={comment.commenterName ?? "?"} size="sm" />
                    <ChannelIcon
                      channel={comment.channel}
                      className="absolute -right-1 -bottom-1 size-4 ring-2 ring-background"
                    />
                  </div>
                  {comment.commenterName && (
                    <span className="text-sm font-medium">{comment.commenterName}</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                </span>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 text-sm">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Comment</p>
                <p>{comment.commentText}</p>
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  AI Employee&apos;s public reply
                </p>
                <p>{comment.replyText}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No public comments replied to yet. Once Facebook comment webhooks are
            connected, they&apos;ll show up here.
          </p>
        )}
      </div>
    </div>
  );
}
