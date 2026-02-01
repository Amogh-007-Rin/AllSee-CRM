-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "resellerId" TEXT;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
