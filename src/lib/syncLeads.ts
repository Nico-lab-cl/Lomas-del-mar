import prisma from "./prisma";
import { queryExternal } from "./externalDb";

export async function syncExternalLeads() {
  console.log("Starting external leads sync...");
  
  try {
    // 1. Fetch from External DB
    const res = await queryExternal(`
      SELECT id, nombre as "firstName", '' as "lastName", email, celular as phone, 
             proyecto as "externalProject", ciudad as city, created_at as "createdAt",
             utm_source as "utmSource", utm_medium as "utmMedium", 
             utm_campaign as "utmCampaign", utm_content as "utmContent", 
             utm_term as "utmTerm"
      FROM leads
      UNION ALL
      SELECT id, '' as "firstName", '' as "lastName", email, '' as phone, 
             'Newsletter' as "externalProject", '' as city, created_at as "createdAt",
             null as "utmSource", null as "utmMedium", 
             null as "utmCampaign", null as "utmContent", 
             null as "utmTerm"
      FROM newsletter_subscribers
    `);

    const externalLeads = res.rows;
    console.log(`Found ${externalLeads.length} leads in external database.`);

    // 2. Upsert into local DB
    let syncedCount = 0;
    for (const ext of externalLeads) {
      if (!ext.email) continue;

      try {
        await (prisma as any).lead.upsert({
          where: { email: ext.email.toLowerCase() },
          update: {
            firstName: ext.firstName,
            phone: ext.phone,
            source: ext.externalProject === 'Newsletter' ? 'Newsletter' : 'web aliminspa.cl',
            city: ext.city,
            interests: ext.externalProject !== 'Newsletter' ? ext.externalProject : undefined,
            utmSource: ext.utmSource,
            utmMedium: ext.utmMedium,
            utmCampaign: ext.utmCampaign,
            utmContent: ext.utmContent,
            utmTerm: ext.utmTerm,
          },
          create: {
            email: ext.email.toLowerCase(),
            firstName: ext.firstName,
            phone: ext.phone,
            source: ext.externalProject === 'Newsletter' ? 'Newsletter' : 'web aliminspa.cl',
            city: ext.city,
            interests: ext.externalProject !== 'Newsletter' ? ext.externalProject : undefined,
            utmSource: ext.utmSource,
            utmMedium: ext.utmMedium,
            utmCampaign: ext.utmCampaign,
            utmContent: ext.utmContent,
            utmTerm: ext.utmTerm,
            createdAt: new Date(ext.createdAt),
            status: 'NEW'
          }
        });
        syncedCount++;
      } catch (upsertError) {
        console.error(`Error syncing lead ${ext.email}:`, upsertError);
      }
    }

    console.log(`Sync completed. Successfully synced ${syncedCount} leads.`);
    return { success: true, count: syncedCount };
  } catch (error) {
    console.error("Critical error during external sync:", error);
    return { success: false, error };
  }
}
