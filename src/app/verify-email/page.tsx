"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";

function VerifyEmailForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Enlace de verificación inválido o faltante.");
            return;
        }

        const verify = async () => {
            try {
                const response = await fetch("/api/auth/verify-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Error al verificar");
                }

                setStatus("success");
            } catch (error: any) {
                setStatus("error");
                setMessage(error.message);
            }
        };

        verify();
    }, [token]);

    return (
        <Card className="z-10 w-full max-w-md border-white/10 bg-black/80 text-white backdrop-blur-md shadow-2xl">
            <CardHeader className="text-center space-y-4">
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
                <CardTitle className="text-2xl font-bold text-[#36595F]">
                    Verificación de Correo
                </CardTitle>
                <CardDescription className="text-gray-400">
                    Estamos confirmando tu dirección de correo electrónico.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-6 space-y-6">
                {status === "loading" && (
                    <>
                        <Loader2 className="h-12 w-12 text-[#36595F] animate-spin" />
                        <p>Verificando...</p>
                    </>
                )}
                {status === "success" && (
                    <>
                        <CheckCircle className="h-16 w-16 text-green-500" />
                        <p className="text-lg font-medium text-center">
                            ¡Tu correo ha sido verificado exitosamente!
                        </p>
                    </>
                )}
                {status === "error" && (
                    <>
                        <XCircle className="h-16 w-16 text-red-500" />
                        <p className="text-lg font-medium text-center text-red-400">
                            {message}
                        </p>
                    </>
                )}
            </CardContent>
            <CardFooter className="flex justify-center">
                {status === "success" ? (
                    <Link href="/login">
                        <Button className="bg-[#36595F] hover:bg-[#2a454a] text-white">
                            Iniciar Sesión
                        </Button>
                    </Link>
                ) : (
                    <Link href="/">
                        <Button variant="ghost" className="text-white hover:bg-white/10">
                            Volver al Inicio
                        </Button>
                    </Link>
                )}
            </CardFooter>
        </Card>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-black/95 px-4 py-12 relative overflow-hidden">
            {/* Background akin to Login/Register */}
            <div className="absolute inset-0 bg-[url('/terreno-bg.JPG')] bg-cover bg-center opacity-20 blur-sm" />

            <Suspense fallback={<div className="text-white">Cargando...</div>}>
                <VerifyEmailForm />
            </Suspense>
        </div>
    );
}
