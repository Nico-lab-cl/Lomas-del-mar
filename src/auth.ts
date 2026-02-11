
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            async authorize(credentials) {
                try {
                    const parsedCredentials = z
                        .object({ email: z.string().email(), password: z.string().min(6) })
                        .safeParse(credentials)

                    if (parsedCredentials.success) {
                        const { email, password } = parsedCredentials.data

                        console.log(`[Auth] Attempting login for: ${email}`);

                        const user = await prisma.user.findUnique({ where: { email } });
                        if (!user) {
                            console.log(`[Auth] User not found: ${email}`);
                            return null;
                        }

                        const passwordsMatch = await bcrypt.compare(password, user.password);
                        if (passwordsMatch) {
                            console.log(`[Auth] Login successful for: ${email}`);
                            return user;
                        }

                        console.log(`[Auth] Password mismatch for: ${email}`);
                    } else {
                        console.log("[Auth] Invalid credentials format");
                    }

                    return null;
                } catch (error) {
                    console.error("[Auth] Error in authorize:", error);
                    return null;
                }
            },
        }),
    ],
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role as Role
                session.user.id = token.id as string
            }
            return session
        },
    },
})
