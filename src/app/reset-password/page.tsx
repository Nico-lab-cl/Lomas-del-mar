"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card";

const formSchema = z
    .object({
        password: z.string().min(6, { message: "Mínimo 6 caracteres" }),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Las contraseñas no coinciden",
        path: ["confirmPassword"],
    });

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!token) {
            toast.error("Token inválido o faltante");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password: values.password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error al restablecer contraseña");
            }

            toast.success("Contraseña actualizada exitosamente");
            router.push("/login"); // Redirect to login
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Error desconocido");
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="text-red-400 text-center">
                Error: Enlace inválido. Por favor solicita uno nuevo.
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="password">Nueva Contraseña</Label>
                <Input
                    id="password"
                    type="password"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#36595F]"
                    {...register("password")}
                />
                {errors.password && (
                    <p className="text-sm text-red-400">{errors.password.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                    id="confirmPassword"
                    type="password"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#36595F]"
                    {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                    <p className="text-sm text-red-400">
                        {errors.confirmPassword.message}
                    </p>
                )}
            </div>

            <Button
                type="submit"
                className="w-full bg-[#36595F] hover:bg-[#2a454a] text-white"
                disabled={isLoading}
            >
                {isLoading ? "Actualizando..." : "Cambiar Contraseña"}
            </Button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-black/95 px-4 py-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/terreno-bg.JPG')] bg-cover bg-center opacity-20 blur-sm" />

            <Card className="z-10 w-full max-w-md border-white/10 bg-black/80 text-white backdrop-blur-md shadow-2xl">
                <CardHeader className="space-y-4 text-center">
                    <div className="flex justify-center mb-4">
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
                        Restablecer Contraseña
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                        Ingresa tu nueva contraseña a continuación
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div className="text-center text-white">Cargando...</div>}>
                        <ResetPasswordForm />
                    </Suspense>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Link
                        href="/login"
                        className="text-sm text-[#36595F] hover:text-[#2a454a] hover:underline"
                    >
                        Volver a Iniciar Sesión
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
