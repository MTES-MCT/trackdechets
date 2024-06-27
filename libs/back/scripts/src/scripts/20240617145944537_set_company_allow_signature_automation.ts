import { Prisma } from "@prisma/client";

export async function run(tx: Prisma.TransactionClient) {
  // We get all existing automations
  const automations = await tx.signatureAutomation.findMany({
    select: { from: { select: { orgId: true } } }
  });

  const siretsWithSignatureAutomations = automations
    .map(s => s.from.orgId)
    .filter<string>((orgId): orgId is string => Boolean(orgId));

  const uniqueSirets = new Set(siretsWithSignatureAutomations);

  // And for every orgId thats has a `from` automation, we update the company to allow signature automation
  await tx.company.updateMany({
    where: {
      siret: { in: [...uniqueSirets] }
    },
    data: { allowAppendix1SignatureAutomation: true }
  });
}
