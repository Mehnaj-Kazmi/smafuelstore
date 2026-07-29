-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "recipient" TEXT,
ALTER COLUMN "state" DROP NOT NULL;
