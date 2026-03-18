import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import admin from "@/lib/firebase-admin";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const userId = (session as any).user?.id;
  const userName = (session as any).user?.name || "Usuario";

  try {
    // 1. Check if user has FCM token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true, name: true },
    });

    if (!user?.fcmToken) {
      return NextResponse.json({
        success: false,
        error: "NO_TOKEN",
        message: `El usuario ${userName} NO tiene token FCM registrado. Abre la app Android, inicia sesión, y vuelve a intentar.`,
        debug: { userId, fcmToken: null }
      }, { status: 400 });
    }

    console.log(`[TEST-PUSH] Token encontrado para ${userName}: ${user.fcmToken.substring(0, 30)}...`);

    // 2. Send test push notification (data-only payload)
    const message = {
      data: {
        title: "🚀 Notificación de Prueba",
        body: `¡Hola ${userName}! Si ves esto, las notificaciones funcionan PERFECTO. 🎉`,
        leadId: "",
        type: "test",
      },
      android: {
        priority: "high" as const,
      },
      token: user.fcmToken,
    };

    const response = await admin.messaging().send(message);
    console.log(`[TEST-PUSH] ✅ Enviado exitosamente. Message ID: ${response}`);

    return NextResponse.json({
      success: true,
      message: `Notificación enviada a ${userName}. ¡Revisa tu celular!`,
      debug: {
        userId,
        tokenPrefix: user.fcmToken.substring(0, 30) + "...",
        firebaseMessageId: response,
      }
    });

  } catch (error: any) {
    console.error("[TEST-PUSH] ❌ Error:", error);

    // Handle specific Firebase errors
    if (error.code === "messaging/registration-token-not-registered") {
      // Token inválido, limpiarlo
      await prisma.user.update({
        where: { id: userId },
        data: { fcmToken: null },
      });
      return NextResponse.json({
        success: false,
        error: "TOKEN_INVALID",
        message: "El token FCM era inválido y fue eliminado. Cierra la app Android, vuelve a abrirla, y prueba de nuevo.",
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: "SEND_FAILED",
      message: error.message,
    }, { status: 500 });
  }
}
