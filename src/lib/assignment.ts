import prisma from "./prisma";

const ADVISORS = [
  { id: "db1e6577-01b1-4615-b35e-0d50752452f3", name: "Marcela" },
  { id: "a6ce92ca-f1a1-4dcf-a042-fda1c31ca485", name: "Orlando" },
  { id: "77cea468-b4a5-44e6-aaa5-0a3f376affb1", name: "Barbara" },
];

export async function getNextAdvisorId() {
  try {
    // Find the last lead assigned to one of our three advisors
    const lastLead = await (prisma as any).lead.findFirst({
      where: {
        assignedToId: { in: ADVISORS.map(a => a.id) }
      },
      orderBy: { createdAt: 'desc' },
      select: { assignedToId: true }
    });

    if (!lastLead || !lastLead.assignedToId) {
      // If no leads assigned yet, start with Marcela
      return ADVISORS[0].id;
    }

    // Find the index of the last advisor
    const lastIdx = ADVISORS.findIndex(a => a.id === lastLead.assignedToId);
    
    // The next index is (lastIdx + 1) mod length
    const nextIdx = (lastIdx + 1) % ADVISORS.length;
    
    return ADVISORS[nextIdx].id;
  } catch (error) {
    console.error("Error calculating next advisor:", error);
    return ADVISORS[0].id; // Fallback to Marcela
  }
}
