import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Attempt to add 'USER' to the Role enum
        // We use executeRawUnsafe because ALTER TYPE cannot be parameterized easily
        // and we need to handle the case where it might already exist (though error says it doesn't)

        await prisma.$executeRawUnsafe(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'USER';`);

        return NextResponse.json({
            success: true,
            message: "Successfully added 'USER' to Role enum."
        });
    } catch (error: any) {
        console.error("Fix DB Error:", error);

        // If the error is "unsurpported" or similar, we might try a fallback or just report it
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : String(error),
            hint: "If this failed, the database user might not have permission to ALTER TYPE."
        }, { status: 500 });
    }
}
