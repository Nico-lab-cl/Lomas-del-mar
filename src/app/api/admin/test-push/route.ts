import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function GET() {
  const session = await getServerSession(authOptions as any);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).user?.id;

  try {
    await createNotification({
      userId,
      title: "Prueba de Notificación 🔔",
      body: "Si ves esto, ¡las notificaciones push están funcionando correctamente!",
      type: "INFO",
    });

    return NextResponse.json({ success: true, message: "Notificación de prueba enviada." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
