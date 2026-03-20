import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Configuración de Meta Webhook (Configura estas en tu .env)
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;

/**
 * GET: Verificación del Webhook por parte de Meta
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook Meta verificado correctamente ✅");
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

/**
 * POST: Recepción de mensajes en tiempo real
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Verificamos que sea un evento de 'page' (Messenger/IG)
    if (body.object === "page") {
      for (const entry of body.entry) {
        // Recorremos los eventos de mensajería
        for (const webhookEvent of entry.messaging) {
          const psid = webhookEvent.sender.id; // ID del usuario que envía
          const platform = entry.id === webhookEvent.recipient.id ? "facebook" : "instagram";
          
          if (webhookEvent.message) {
            await handleIncomingMessage(psid, webhookEvent.message.text, platform);
          }
        }
      }
      return new Response("EVENT_RECEIVED", { status: 200 });
    }

    return new Response("Not Found", { status: 404 });
  } catch (error) {
    console.error("Error en Webhook Meta:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * Lógica para guardar el mensaje y vincular al Lead
 */
async function handleIncomingMessage(psid: string, text: string, platform: string) {
  // 1. Buscar o crear la conversación
  const conversation = await (prisma as any).conversation.upsert({
    where: { psid },
    update: { updatedAt: new Date() },
    create: {
      psid,
      platform,
      // Aquí podrías implementar lógica para buscar un lead por perfil de FB si tienes acceso
    }
  });

  // 2. Guardar el mensaje
  await (prisma as any).message.create({
    data: {
      conversationId: conversation.id,
      text,
      senderType: "meta",
    }
  });

  console.log(`Mensaje guardado para PSID ${psid}: ${text}`);
  
  // TODO: Trigger push notification para los asesores
}
