
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

export async function POST(req: Request) {
    try {
        const { token } = await req.json();

        if (!token) {
            return NextResponse.json({ error: "Token requerido" }, { status: 400 });
        }

        const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "fallback_secret");

        try {
            const { payload } = await jwtVerify(token, secret);

            // Optional: Check if token type is correct
            if (payload.type !== 'email-verification') {
                return NextResponse.json({ error: "Token inválido" }, { status: 400 });
            }

            const email = payload.email as string;

            if (!email) {
                return NextResponse.json({ error: "Token inválido: sin email" }, { status: 400 });
            }

            await prisma.user.update({
                where: { email },
                data: { emailVerified: new Date() },
            });

            return NextResponse.json({ success: true, message: "Email verificado exitosamente" });

        } catch (err) {
            return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 });
        }

    } catch (error) {
        console.error("Verify Email Error:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
