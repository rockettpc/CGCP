-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('InProgress', 'Quoted', 'Completed');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "status" "ProjectStatus" NOT NULL DEFAULT 'InProgress';
