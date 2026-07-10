-- CreateTable
CREATE TABLE "CommentReply" (
    "id" TEXT NOT NULL,
    "channelConnectionId" TEXT NOT NULL,
    "channel" "ConversationChannel" NOT NULL,
    "externalCommentId" TEXT NOT NULL,
    "postId" TEXT,
    "commenterName" TEXT,
    "commentText" TEXT NOT NULL,
    "replyText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommentReply_externalCommentId_key" ON "CommentReply"("externalCommentId");

-- AddForeignKey
ALTER TABLE "CommentReply" ADD CONSTRAINT "CommentReply_channelConnectionId_fkey" FOREIGN KEY ("channelConnectionId") REFERENCES "ChannelConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

