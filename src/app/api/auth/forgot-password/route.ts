
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email requerido" }, { status: 400 });
        }

        // 1. Check if user exists
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json({ error: "El correo no está registrado en nuestra base de datos" }, { status: 404 });
        }

        // 2. Generate a secure, short-lived token (15 mins)
        const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "fallback_secret_change_me");
        const token = await new SignJWT({ email: user.email, sub: user.id })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("15m")
            .sign(secret);

        // 3. Construct the Reset Link
        // We need the base URL. In production, this should be an ENV var or constructed from headers.
        // For now, let's assume standard deployment or localhost.
        const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
        const resetLink = `${baseUrl}/reset-password?token=${token}`;

        // 4. Send to n8n Webhook
        const webhookUrl = process.env.N8N_PASSWORD_RESET_WEBHOOK_URL;

        if (!webhookUrl) {
            console.error("Missing N8N_PASSWORD_RESET_WEBHOOK_URL env var");
            // In dev, we might want to log the link so we can test without n8n
            if (process.env.NODE_ENV === "development") {
                console.log("DEBUG MODE - Reset Link:", resetLink);
                return NextResponse.json({ success: true, debug_link: resetLink });
            }
            return NextResponse.json({ error: "Internal Server Error: Webhook config missing" }, { status: 500 });
        }

        // Fire and forget (or await if we want to confirm n8n received it)
        await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: user.email,
                name: user.name,
                resetLink,
                timestamp: new Date().toISOString(),
            }),
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
