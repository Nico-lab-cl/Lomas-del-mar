import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z, ZodError } from 'zod';
import { Role } from '@prisma/client';
import { SignJWT } from 'jose';

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password } = registerSchema.parse(body);

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'El correo electrónico ya está registrado' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user with default USER role
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: Role.USER,
                // emailVerified is null by default
            },
        });

        // --- Email Verification Logic ---

        // 1. Generate Verification Token (24h expiration)
        const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "fallback_secret");
        const token = await new SignJWT({ email: user.email, sub: user.id, type: 'email-verification' })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("24h")
            .sign(secret);

        // 2. Construct Link
        const protocol = req.headers.get("x-forwarded-proto") || "http";
        const host = req.headers.get("host");
        const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`;
        const verificationLink = `${baseUrl}/verify-email?token=${token}`;

        // 3. Send to n8n Webhook
        const webhookUrl = "https://n8n-n8n.yszha2.easypanel.host/webhook/6014ee07-0470-4a07-aa94-2e5266bd9a03";

        // Blocking fetch to ensure execution in serverless environment
        try {
            await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: user.email,
                    name: user.name,
                    verificationLink,
                    timestamp: new Date().toISOString(),
                }),
            });
        } catch (webhookError) {
            console.error("Failed to send verification email webhook:", webhookError);
            // We don't fail the registration, but we log the error
        }

        // -------------------------------

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json(
            {
                message: 'Usuario creado exitosamente. Se ha enviado un correo de verificación.',
                user: userWithoutPassword
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Registration error:', error);
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: 'Datos inválidos', details: (error as any).errors },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
