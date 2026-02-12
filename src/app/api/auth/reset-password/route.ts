
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json(
                { error: "Token y contraseña son requeridos" },
                { status: 400 }
            );
        }

        // 1. Verify Token
        const secret = new TextEncoder().encode(
            process.env.AUTH_SECRET || "fallback_secret_change_me"
        );

        let payload;
        try {
            const verified = await jwtVerify(token, secret);
            payload = verified.payload;
        } catch (err) {
            return NextResponse.json(
                { error: "El enlace es inválido o ha expirado" },
                { status: 400 }
            );
        }

        const email = payload.email as string;

        if (!email) {
            return NextResponse.json({ error: "Token inválido" }, { status: 400 });
        }

        // 2. Hash New Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Update User
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Reset Password Error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
