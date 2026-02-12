"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { BackToSiteButton } from "@/components/BackToSiteButton";

const formSchema = z.object({
    email: z.string().email({ message: "Email inválido" }),
});

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al enviar solicitud");
            }

            setIsSubmitted(true);
            toast.success("Correo de recuperación enviado");
        } catch (error) {
            console.error(error);
            toast.error("Hubo un problema. Intenta nuevamente.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-black/95 px-4 py-12 relative overflow-hidden">
            {/* Background akin to Login/Register */}
            <div className="absolute inset-0 bg-[url('/terreno-bg.JPG')] bg-cover bg-center opacity-20 blur-sm" />

            <div className="absolute top-4 left-4 z-50">
                <Link href="/">
                    <Button variant="ghost" className="text-white hover:bg-white/10">
                        ← Volver al inicio
                    </Button>
                </Link>
            </div>

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
                        Recuperar Contraseña
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                        {!isSubmitted
                            ? "Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña."
                            : "Revisa tu bandeja de entrada."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!isSubmitted ? (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="ejemplo@correo.com"
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#36595F]"
                                    {...register("email")}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-400">{errors.email.message}</p>
                                )}
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-[#36595F] hover:bg-[#2a454a] text-white"
                                disabled={isLoading}
                            >
                                {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center space-y-4">
                            <p className="text-sm text-gray-300">
                                Hemos enviado un correo con las instrucciones. Si no lo recibes en
                                unos minutos, revisa tu carpeta de Spam.
                            </p>
                            <Button
                                variant="outline"
                                className="w-full border-white/20 text-white hover:bg-white/10 hover:text-white"
                                onClick={() => setIsSubmitted(false)}
                            >
                                Intentar con otro correo
                            </Button>
                        </div>
                    )}
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
