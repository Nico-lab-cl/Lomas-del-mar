-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SELLER');

-- CreateTable
CREATE TABLE "Lot" (
    "id" SERIAL NOT NULL,
    "number" TEXT,
    "stage" INTEGER,
    "area_m2" DOUBLE PRECISION,
    "price_total_clp" INTEGER,
    "reservation_amount_clp" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'available',
    "reserved_until" TIMESTAMP(3),
    "reserved_at" TIMESTAMP(3),
    "reserved_by" TEXT,
    "order_id" TEXT,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "Lot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "lot_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "rut" TEXT,
    "address" TEXT,
    "folio" TEXT,
    "status" TEXT NOT NULL,
    "session_id" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "marital_status" TEXT,
    "profession" TEXT,
    "nationality" TEXT DEFAULT 'Chilena',
    "address_street" TEXT,
    "address_number" TEXT,
    "address_commune" TEXT,
    "address_region" TEXT,
    "seller_id" TEXT,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotLock" (
    "lot_id" INTEGER NOT NULL,
    "locked_by" TEXT NOT NULL,
    "locked_until" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LotLock_pkey" PRIMARY KEY ("lot_id")
);

-- CreateTable
CREATE TABLE "WebpayTransaction" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "buy_order" TEXT NOT NULL,
    "amount_clp" INTEGER NOT NULL,
    "status" TEXT,
    "response_code" INTEGER,
    "transaction_date" TIMESTAMP(3),
    "authorization_code" TEXT,
    "payment_type_code" TEXT,
    "installments_number" INTEGER,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reservation_id" TEXT NOT NULL,
    "lot_id" INTEGER NOT NULL,

    CONSTRAINT "WebpayTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SELLER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebpayTransaction_token_key" ON "WebpayTransaction"("token");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotLock" ADD CONSTRAINT "LotLock_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebpayTransaction" ADD CONSTRAINT "WebpayTransaction_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebpayTransaction" ADD CONSTRAINT "WebpayTransaction_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

