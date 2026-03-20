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

    if (body.object === "page" || body.object === "instagram") {
      for (const entry of body.entry) {
        // --- 1. PROCESAR MENSAJES DIRECTOS (Messenger / IG DM) ---
        if (entry.messaging) {
          for (const webhookEvent of entry.messaging) {
            const psid = webhookEvent.sender.id;
            // Si el objeto es 'instagram' o el ID de entrada coincide con Instagram
            const platform = body.object === "instagram" ? "instagram" : "facebook";
            
            if (webhookEvent.message && webhookEvent.message.text) {
              await handleIncomingMessage(psid, webhookEvent.message.text, platform, "DIRECT", webhookEvent.message.mid);
            }
          }
        }

        // --- 2. PROCESAR COMENTARIOS (Feed FB) ---
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === "feed" && change.value.item === "comment" && change.value.verb === "add") {
              const psid = change.value.from.id;
              const text = change.value.message;
              const platform = "facebook";
              const commentId = change.value.comment_id;
              
              await handleIncomingMessage(psid, text, platform, "COMMENT", commentId);
            }
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

async function fetchMetaProfile(psid: string, platform: string) {
  try {
    const fields = platform === "facebook" ? "first_name,last_name,profile_pic" : "name,profile_pic";
    const res = await fetch(`https://graph.facebook.com/v21.0/${psid}?fields=${fields}&access_token=${process.env.META_PAGE_ACCESS_TOKEN}`);
    const data = await res.json();
    
    if (data.error) {
      console.error("Meta API error:", data.error);
      return null;
    }

    return {
      name: platform === "facebook" ? `${data.first_name || ""} ${data.last_name || ""}`.trim() : data.name,
      image: data.profile_pic
    };
  } catch (error) {
    console.error("Error fetching Meta profile:", error);
    return null;
  }
}

async function handleIncomingMessage(psid: string, text: string, platform: string, sourceType: string, sourceId: string) {
  // 1. Buscar o crear la conversación por PSID
  let conversation = await (prisma as any).conversation.findUnique({
    where: { psid }
  });

  if (!conversation) {
    const profile = await fetchMetaProfile(psid, platform);
    conversation = await (prisma as any).conversation.create({
      data: {
        psid,
        platform,
        metaName: profile?.name,
        metaImage: profile?.image,
      }
    });
  } else if (!conversation.metaName || !conversation.metaImage) {
    // Si ya existe pero le falta el nombre o imagen, intentamos actualizarlo
    const profile = await fetchMetaProfile(psid, platform);
    if (profile) {
      conversation = await (prisma as any).conversation.update({
        where: { id: conversation.id },
        data: { metaName: profile.name, metaImage: profile.image }
      });
    }
  }

  // 2. Guardar el mensaje/comentario
  await (prisma as any).message.create({
    data: {
      conversationId: conversation.id,
      text,
      senderType: "meta",
      sourceType,
      sourceId,
    }
  });

  // 3. Actualizar el timestamp de la conversación para que suba en la lista
  await (prisma as any).conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() }
  });

  console.log(`[${sourceType}] Guardado de ${psid}: ${text}`);
}
