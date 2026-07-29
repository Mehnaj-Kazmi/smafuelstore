-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;
