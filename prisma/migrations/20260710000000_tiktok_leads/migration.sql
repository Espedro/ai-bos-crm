-- CreateTable
CREATE TABLE "TikTokAdsConnection" (
    "id" TEXT NOT NULL,
    "status" "ChannelConnectionStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "displayName" TEXT,
    "advertiserId" TEXT,
    "accessToken" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "lastErrorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TikTokAdsConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TikTokLead" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "externalLeadId" TEXT NOT NULL,
    "contactId" TEXT,
    "data" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TikTokLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TikTokLead_externalLeadId_key" ON "TikTokLead"("externalLeadId");

-- AddForeignKey
ALTER TABLE "TikTokLead" ADD CONSTRAINT "TikTokLead_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "TikTokAdsConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TikTokLead" ADD CONSTRAINT "TikTokLead_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

