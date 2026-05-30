-- CreateEnum
CREATE TYPE "SeatType" AS ENUM ('ANY', 'SEATER', 'SLEEPER');

-- CreateEnum
CREATE TYPE "BusType" AS ENUM ('ANY', 'AC', 'NON_AC');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Recommendation" AS ENUM ('BOOK_NOW', 'WAIT');

-- CreateTable
CREATE TABLE "TelegramUser" (
    "id" TEXT NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackedTrip" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceCity" TEXT NOT NULL,
    "destinationCity" TEXT NOT NULL,
    "normalizedSource" TEXT NOT NULL,
    "normalizedDest" TEXT NOT NULL,
    "journeyDate" TIMESTAMP(3) NOT NULL,
    "seatType" "SeatType" NOT NULL DEFAULT 'ANY',
    "busType" "BusType" NOT NULL DEFAULT 'ANY',
    "departureWindow" TEXT,
    "preferredOperator" TEXT,
    "status" "TripStatus" NOT NULL DEFAULT 'ACTIVE',
    "nextCollectionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackedTrip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FareSnapshot" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "lowestFarePaise" INTEGER NOT NULL,
    "medianFarePaise" INTEGER NOT NULL,
    "busCount" INTEGER NOT NULL,
    "availableSeats" INTEGER NOT NULL,
    "operatorName" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hoursToDeparture" DOUBLE PRECISION NOT NULL,
    "raw" JSONB,

    CONSTRAINT "FareSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Forecast" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "currentFarePaise" INTEGER NOT NULL,
    "predictedLowestFarePaise" INTEGER NOT NULL,
    "expectedBestWindow" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "recommendation" "Recommendation" NOT NULL,
    "reasoning" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Forecast_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramUser_telegramId_key" ON "TelegramUser"("telegramId");

-- CreateIndex
CREATE INDEX "TrackedTrip_status_nextCollectionAt_idx" ON "TrackedTrip"("status", "nextCollectionAt");

-- CreateIndex
CREATE INDEX "TrackedTrip_normalizedSource_normalizedDest_journeyDate_idx" ON "TrackedTrip"("normalizedSource", "normalizedDest", "journeyDate");

-- CreateIndex
CREATE INDEX "FareSnapshot_tripId_observedAt_idx" ON "FareSnapshot"("tripId", "observedAt");

-- CreateIndex
CREATE INDEX "Forecast_tripId_createdAt_idx" ON "Forecast"("tripId", "createdAt");

-- AddForeignKey
ALTER TABLE "TrackedTrip" ADD CONSTRAINT "TrackedTrip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "TelegramUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FareSnapshot" ADD CONSTRAINT "FareSnapshot_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "TrackedTrip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Forecast" ADD CONSTRAINT "Forecast_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "TrackedTrip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
