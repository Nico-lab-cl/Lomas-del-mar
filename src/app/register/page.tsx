"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Mail, Lock, ArrowRight } from 'lucide-react';

const registerSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const form = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    });

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    password: data.password,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                if (result.error === 'El correo electrónico ya está registrado') {
                    form.setError('email', { message: 'El correo electrónico ya está registrado' });
                    throw new Error('El correo electrónico ya está registrado');
                }
                const errorMessage = result.details
                    ? `${result.error}: ${result.details}`
                    : (result.error || 'Error al registrarse');
                throw new Error(errorMessage);
            }

            // Instead of redirecting, we show a success state
            setIsSuccess(true);
            toast({
                title: "¡Cuenta creada!",
                description: "Revisa tu correo para verificar tu cuenta.",
                className: "bg-[#36595F] text-white border-none",
            });

        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Hubo un problema al crear la cuenta",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex w-full items-center justify-center bg-[#FDF9F3] p-4">
                <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl space-y-6 text-center">
                    <div className="mx-auto w-16 h-16 bg-[#36595F]/10 rounded-full flex items-center justify-center">
                        <Mail className="h-8 w-8 text-[#36595F]" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-[#36595F]">¡Cuenta creada!</h2>
                        <p className="text-muted-foreground">
                            Hemos enviado un enlace de verificación a tu correo electrónico. Por favor revisa tu bandeja de entrada (y spam) para activar tu cuenta.
                        </p>
                    </div>
                    <Button
                        onClick={() => router.push('/login')}
                        className="w-full bg-[#36595F] hover:bg-[#2A464B] text-white"
                    >
                        Ir al Login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex w-full">
            {/* Decorative Section (Hidden on mobile) */}
            <div className="hidden lg:flex w-1/2 bg-[#36595F] items-center justify-center p-12 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2A464B] to-[#36595F] opacity-50"></div>

                {/* Decorative Circles */}
                <div className="absolute -top-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#D4A373]/20 rounded-full blur-3xl"></div>

                <div className="z-10 max-w-lg space-y-8 relative">
                    <div className="space-y-4">
                        <h1 className="text-6xl font-bold tracking-tight">
                            Lomas del <span className="text-[#D4A373]">Mar</span>
                        </h1>
                        <p className="text-xl text-white/80 leading-relaxed">
                            Tu refugio soñado en la costa te espera. Únete a nuestra comunidad y gestiona tu inversión de manera simple y segura.
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Section */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#FDF9F3] p-8 lg:p-12 relative">
                {/* Mobile Background Decoration */}
                <div className="lg:hidden absolute inset-0 bg-[#36595F]/5 pointer-events-none"></div>

                <div className="w-full max-w-md space-y-8 bg-white lg:bg-transparent p-6 rounded-2xl shadow-xl lg:shadow-none relative z-10">
                    <div className="text-center space-y-2 lg:text-left">
                        <h2 className="text-3xl font-bold text-[#36595F]">Crear Cuenta</h2>
                        <p className="text-muted-foreground">Ingresa tus datos para comenzar</p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[#36595F]">Nombre completo</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                                <Input
                                                    placeholder="Juan Pérez"
                                                    className="pl-10 border-[#36595F]/20 focus-visible:ring-[#36595F] bg-white/50"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[#36595F]">Email</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                                <Input
                                                    placeholder="nombre@ejemplo.com"
                                                    className="pl-10 border-[#36595F]/20 focus-visible:ring-[#36595F] bg-white/50"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[#36595F]">Contraseña</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground z-10" />
                                                <PasswordInput
                                                    placeholder="******"
                                                    className="pl-10 border-[#36595F]/20 focus-visible:ring-[#36595F] bg-white/50"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[#36595F]">Confirmar Contraseña</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground z-10" />
                                                <PasswordInput
                                                    placeholder="******"
                                                    className="pl-10 border-[#36595F]/20 focus-visible:ring-[#36595F] bg-white/50"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full bg-[#36595F] hover:bg-[#2A464B] text-white h-12 text-lg font-medium transition-all hover:scale-[1.02]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Registrando...
                                    </>
                                ) : (
                                    <>
                                        Registrarse
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>

                    <div className="mt-8 text-center">
                        <p className="text-muted-foreground text-sm">
                            ¿Ya tienes una cuenta?{' '}
                            <Link href="/login" className="text-[#36595F] hover:text-[#D4A373] font-bold transition-colors">
                                Inicia sesión aquí
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
