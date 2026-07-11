-- Multi-tenant migration: introduce Business as the tenant root, add a
-- nullable businessId to every tenant table, backfill it to a single
-- Business row derived from the existing (singleton) BusinessProfile, then
-- tighten every column to NOT NULL and wire up foreign keys/uniques.
-- Safe on non-empty tables: columns are added nullable first, backfilled,
-- then constrained — never a bare `ADD COLUMN ... NOT NULL` on live data.
-- Wrapped in one transaction so a failure anywhere rolls back everything.

BEGIN;

-- Step 1: create the Business table
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "emailFromName" TEXT,
    "emailFromAddress" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");

-- Step 2: seed exactly one Business row from the existing singleton
-- BusinessProfile row (if any), reusing its id and a slugified name so
-- existing data has continuity. If no BusinessProfile exists yet (a brand
-- new deployment that hasn't run /setup), this inserts nothing and every
-- backfill UPDATE below becomes a no-op over zero rows.
INSERT INTO "Business" (id, slug, name, description, "emailFromName", "emailFromAddress", "completedAt", "createdAt", "updatedAt")
SELECT
  id,
  lower(regexp_replace(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')),
  name,
  description,
  "emailFromName",
  "emailFromAddress",
  "completedAt",
  "createdAt",
  "updatedAt"
FROM "BusinessProfile"
LIMIT 1;

-- Step 3: add businessId nullable to every tenant table
ALTER TABLE "Agent" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Company" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Contact" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Stage" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Deal" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Task" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Note" ADD COLUMN "businessId" TEXT;
ALTER TABLE "ActivityEvent" ADD COLUMN "businessId" TEXT;
ALTER TABLE "BusinessResource" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Form" ADD COLUMN "businessId" TEXT;
ALTER TABLE "FormSubmission" ADD COLUMN "businessId" TEXT;
ALTER TABLE "EmailTemplate" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Campaign" ADD COLUMN "businessId" TEXT;
ALTER TABLE "CampaignRecipient" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "businessId" TEXT;
ALTER TABLE "ChannelConnection" ADD COLUMN "businessId" TEXT;
ALTER TABLE "CommentReply" ADD COLUMN "businessId" TEXT;
ALTER TABLE "TikTokAdsConnection" ADD COLUMN "businessId" TEXT;
ALTER TABLE "TikTokLead" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Message" ADD COLUMN "businessId" TEXT;

-- Step 4: backfill every row to the one Business created above (today's
-- live data is conceptually a single tenant already)
UPDATE "Agent" SET "businessId" = (SELECT id FROM "Business" LIMIT 1);
UPDATE "Company" SET "businessId" = (SELECT id FROM "Business" LIMIT 1);
UPDATE "Contact" SET "businessId" = (SELECT id FROM "Business" LIMIT 1);
UPDATE "Stage" SET "businessId" = (SELECT id FROM "Business" LIMIT 1);
UPDATE "Deal" SET "businessId" = (SELECT id FROM "Business" LIMIT 1);
UPDATE "Task" SET "businessId" = (SELECT id FROM "Business" LIMIT 1);
UPDATE "Note" SET "businessId" = (SELECT id FROM "Business" LIMIT 1);
UPDATE "ActivityEvent" SET "businessId" = (SELECT id FROM "Business" LIMIT 1);
UPDATE "BusinessResource" SET "businessId" = (SELECT id FROM "Business" LIMIT 1);
UPDATE "Form" SET "businessId" = (SELECT id FROM "Business" LIMIT 1);
UPDATE "FormSubmission" SET "businessId" = (SELECT id FROM "Business" LIMIT 1);
UPDATE "EmailTemplate" SET "businessId" = (SELECT id FROM "Business" LIMIT 1);
UPDATE "Campaign" SET "businessId" = (SELECT id FROM "Business" LIMIT 1);
UPDATE "CampaignRecipient" SET "businessId" = (SELECT id FROM "Business" LIMIT 1);
UPDATE "Conversation" SET "businessId" = (SELECT id FROM "Business" LIMIT 1);
UPDATE "ChannelConnection" SET "businessId" = (SELECT id FROM "Business" LIMIT 1);
UPDATE "CommentReply" SET "businessId" = (SELECT id FROM "Business" LIMIT 1);
UPDATE "TikTokAdsConnection" SET "businessId" = (SELECT id FROM "Business" LIMIT 1);
UPDATE "TikTokLead" SET "businessId" = (SELECT id FROM "Business" LIMIT 1);
UPDATE "Message" SET "businessId" = (SELECT id FROM "Business" LIMIT 1);

-- Step 5: tighten to NOT NULL now that every row is backfilled
ALTER TABLE "Agent" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Company" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Contact" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Stage" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Deal" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Note" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "ActivityEvent" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "BusinessResource" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Form" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "FormSubmission" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "EmailTemplate" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Campaign" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "CampaignRecipient" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Conversation" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "ChannelConnection" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "CommentReply" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "TikTokAdsConnection" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "TikTokLead" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Message" ALTER COLUMN "businessId" SET NOT NULL;

-- Step 6: fix unique constraints that assumed single-tenancy
DROP INDEX "Agent_email_key";
CREATE UNIQUE INDEX "Agent_businessId_email_key" ON "Agent"("businessId", "email");

DROP INDEX "ChannelConnection_channel_key";
CREATE UNIQUE INDEX "ChannelConnection_businessId_channel_key" ON "ChannelConnection"("businessId", "channel");

CREATE UNIQUE INDEX "TikTokAdsConnection_businessId_key" ON "TikTokAdsConnection"("businessId");

-- Step 7: foreign keys
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Company" ADD CONSTRAINT "Company_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Note" ADD CONSTRAINT "Note_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BusinessResource" ADD CONSTRAINT "BusinessResource_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Form" ADD CONSTRAINT "Form_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChannelConnection" ADD CONSTRAINT "ChannelConnection_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommentReply" ADD CONSTRAINT "CommentReply_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TikTokAdsConnection" ADD CONSTRAINT "TikTokAdsConnection_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TikTokLead" ADD CONSTRAINT "TikTokLead_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 8: BusinessProfile's data has been copied into Business — safe to drop
DROP TABLE "BusinessProfile";

COMMIT;
