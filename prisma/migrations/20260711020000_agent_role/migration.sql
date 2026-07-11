-- CreateEnum
CREATE TYPE "AgentRole" AS ENUM ('ADMIN', 'MEMBER');

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "role" "AgentRole" NOT NULL DEFAULT 'ADMIN';

