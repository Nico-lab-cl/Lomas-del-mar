import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const META_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;

async function fetchMetaProfile(psid: string, platform: string) {
  try {
    const fields = platform === "facebook" ? "first_name,last_name,profile_pic" : "name,profile_pic";
    const res = await axios.get(`https://graph.facebook.com/v21.0/${psid}?fields=${fields}&access_token=${META_TOKEN}`);
    const data = res.data;
    
    return {
      name: platform === "facebook" ? `${data.first_name || ""} ${data.last_name || ""}`.trim() : data.name,
      image: data.profile_pic
    };
  } catch (error: any) {
    console.error(`Error fetching profile for ${psid}:`, error.response?.data || error.message);
    return null;
  }
}

async function main() {
  console.log("🚀 Iniciando sincronización de perfiles Meta...");
  
  if (!META_TOKEN || META_TOKEN === "your_token_here") {
    console.error("❌ Error: No se ha configurado META_PAGE_ACCESS_TOKEN en el .env");
    return;
  }

  const conversations = await (prisma as any).conversation.findMany();
  console.log(`Buscando perfiles para ${conversations.length} conversaciones...`);

  for (const conv of conversations) {
    console.log(`Sincronizando ${conv.psid} (${conv.platform})...`);
    const profile = await fetchMetaProfile(conv.psid, conv.platform);
    
    if (profile) {
      await (prisma as any).conversation.update({
        where: { id: conv.id },
        data: {
          metaName: profile.name,
          metaImage: profile.image
        }
      });
      console.log(`✅ Actualizado: ${profile.name}`);
    }
  }

  console.log("✨ Sincronización completada.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
