-- AlterEnum
ALTER TYPE "RequestStatus" ADD VALUE 'QUOTED';

-- AlterTable
ALTER TABLE "RenewalRequest" ADD COLUMN     "quotePdfData" TEXT,
ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "responseMessage" TEXT;
