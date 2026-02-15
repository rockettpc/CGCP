-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "installDate" TIMESTAMP(3),
ADD COLUMN     "jobNumber" TEXT,
ADD COLUMN     "measureDate" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT;
