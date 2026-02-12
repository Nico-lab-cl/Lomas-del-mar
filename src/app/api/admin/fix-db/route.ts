import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const sql = `
            -- Fix Enum
            ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'USER';

            -- Fix Reservation Columns
            ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "buyer_id" TEXT;
            ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "seller_id" TEXT;
            ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "marital_status" TEXT;
            ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "profession" TEXT;
            ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "nationality" TEXT DEFAULT 'Chilena';
            ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "address_street" TEXT;
            ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "address_number" TEXT;
            ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "address_commune" TEXT;
            ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "address_region" TEXT;

            -- Fix Foreign Keys (using DO block for safety)
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Reservation_buyer_id_fkey') THEN 
                    ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; 
                END IF; 
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Reservation_seller_id_fkey') THEN 
                    ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; 
                END IF;
            END $$;
        `;

        // Execute raw SQL
        await prisma.$executeRawUnsafe(sql);

        return NextResponse.json({
            success: true,
            message: "Database schema patched successfully."
        });
    } catch (error: any) {
        console.error("Fix DB Error:", error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : String(error),
            hint: "Check server logs for details."
        }, { status: 500 });
    }
}
