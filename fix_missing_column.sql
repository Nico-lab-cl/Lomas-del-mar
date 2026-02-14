-- Add buyer_id column to Reservation table
ALTER TABLE "Reservation" ADD COLUMN "buyer_id" TEXT;

-- Add foreign key constraint linking buyer_id to User(id)
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
