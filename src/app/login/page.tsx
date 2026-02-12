'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';

const loginSchema = z.object({
    email: z.string().email({ message: "Email inválido" }),
    password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email: data.email,
                password: data.password,
            });

            if (result?.error) {
                toast.error('Credenciales inválidas');
                setIsLoading(false);
            } else {
                toast.success('Inicio de sesión exitoso');

                // Fetch session to check role
                const response = await fetch('/api/auth/session');
                const session = await response.json();

                if (session?.user?.role === 'ADMIN') {
                    // Redirect to home/map for everyone initially
                    router.push('/');
                } else {
                    router.push('/');
                }

                router.refresh();
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Ocurrió un error al intentar ingresar');
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-black/95 px-4 py-12">
            <div className="absolute inset-0 bg-[url('/terreno-bg.JPG')] bg-cover bg-center opacity-20 blur-sm" />

            <Card className="z-10 w-full max-w-md border-white/10 bg-black/80 text-white backdrop-blur-md">
                <CardHeader className="space-y-4 text-center">
                    <div className="flex justify-center">
                        <div className="relative h-16 w-48">
                            <Image
                                src="/logo.png"
                                alt="Lomas del Mar"
                                fill
                                className="object-contain invert"
                                priority
                            />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-[#36595F]">
                        Iniciar Sesión
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                        Ingresa a tu cuenta para continuar
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@lomasdelmar.cl"
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#36595F]"
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="text-sm text-red-400">{errors.email.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#36595F]"
                                {...register('password')}
                            />
                            {errors.password && (
                                <p className="text-sm text-red-400">{errors.password.message}</p>
                            )}
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-[#36595F] hover:bg-[#2a454a] text-white"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col items-center gap-4">
                    <p className="text-sm text-gray-400">
                        ¿No tienes cuenta?{' '}
                        <span
                            onClick={() => router.push('/register')}
                            className="text-[#36595F] hover:text-[#2a454a] cursor-pointer font-semibold"
                        >
                            Regístrate aquí
                        </span>
                    </p>
                    <p className="text-xs text-gray-500">
                        © 2024 Lomas del Mar. Todos los derechos reservados.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
