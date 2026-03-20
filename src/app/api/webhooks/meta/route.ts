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
              console.log(`[DIRECT] Full PSID from ${platform}: ${psid}`);
              await handleIncomingMessage(psid, webhookEvent.message.text, platform, "DIRECT", webhookEvent.message.mid);
            }
          }
        }

        // --- 2. PROCESAR COMENTARIOS (Feed FB / IG Comments) ---
        if (entry.changes) {
          for (const change of entry.changes) {
            // Comentarios de Facebook
            if (change.field === "feed" && change.value.item === "comment" && change.value.verb === "add") {
              const psid = change.value.from.id;
              const text = change.value.message;
              const platform = "facebook";
              const commentId = change.value.comment_id;
              const postId = change.value.post_id;
              
              console.log(`[COMMENT] FB Post ID: ${postId}, Full PSID: ${psid}`);
              const postContent = await fetchPostContent(postId, "facebook");

              await handleIncomingMessage(psid, text, platform, "COMMENT", commentId, postId, postContent);
            }
            
            // Comentarios de Instagram
            if (change.field === "comments") {
              const psid = change.value.from.id;
              const text = change.value.text;
              const platform = "instagram";
              const commentId = change.value.id;
              const mediaId = change.value.media?.id;
              
              console.log(`[COMMENT] IG Media ID: ${mediaId}, Full PSID: ${psid}`);
              const postContent = await fetchPostContent(mediaId, "instagram");

              await handleIncomingMessage(psid, text, platform, "COMMENT", commentId, mediaId, postContent);
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
      console.error("Meta API error detail:", JSON.stringify(data.error, null, 2));
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

async function fetchPostContent(id: string, platform: string) {
  if (!id) return null;
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  try {
    const fields = platform === "facebook" ? "message,full_picture" : "caption,media_url";
    const res = await fetch(`https://graph.facebook.com/v21.0/${id}?fields=${fields}&access_token=${token}`);
    const data = await res.json();
    
    if (data.error) return null;

    return JSON.stringify({
      text: platform === "facebook" ? data.message : data.caption,
      image: platform === "facebook" ? data.full_picture : data.media_url
    });
  } catch (error) {
    return null;
  }
}

async function handleIncomingMessage(psid: string, text: string, platform: string, sourceType: string, sourceId: string, postId?: string, postContent?: string | null) {
  // 1. Buscar o crear la conversación por PSID
  let conversation = await (prisma as any).conversation.findUnique({
    where: { psid }
  });

  if (!conversation) {
    console.log(`Buscando perfil para PSID nuevo: ${psid}`);
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
    console.log(`Actualizando perfil para PSID existente: ${psid}`);
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
      postId,
      postContent,
    }
  });

  // 3. Actualizar el timestamp de la conversación para que suba en la lista
  await (prisma as any).conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() }
  });

  console.log(`[${sourceType}] Guardado de ${psid}: ${text}`);
}
