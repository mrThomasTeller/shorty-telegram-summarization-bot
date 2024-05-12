-- CreateTable
CREATE TABLE "ActivationKey" (
    "id" TEXT NOT NULL,
    "tariffId" TEXT NOT NULL,
    "subscriptionId" BIGINT,

    CONSTRAINT "ActivationKey_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ActivationKey" ADD CONSTRAINT "ActivationKey_tariffId_fkey" FOREIGN KEY ("tariffId") REFERENCES "Tariff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivationKey" ADD CONSTRAINT "ActivationKey_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
