import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z, ZodError } from 'zod';
import { Role } from '@prisma/client';

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
            },
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json(
            { message: 'Usuario creado exitosamente', user: userWithoutPassword },
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
