-- CreateEnum
CREATE TYPE "DealKind" AS ENUM ('flash', 'percent', 'bogo', 'weekend');

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "kind" "DealKind" NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "percentOff" INTEGER,
    "endsInHours" INTEGER,
    "imageUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DealProducts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DealProducts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_DealProducts_B_index" ON "_DealProducts"("B");

-- AddForeignKey
ALTER TABLE "_DealProducts" ADD CONSTRAINT "_DealProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DealProducts" ADD CONSTRAINT "_DealProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
