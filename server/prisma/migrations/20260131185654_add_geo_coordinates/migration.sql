-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "graceTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "RenewalRequest" ADD COLUMN     "deviceIds" TEXT[];
