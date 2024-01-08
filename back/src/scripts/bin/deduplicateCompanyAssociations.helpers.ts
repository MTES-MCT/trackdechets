#!/usr/bin/env ts-node
import { prisma } from "@td/prisma";

type Duplicate = {
  companyId: string;
  userId: string;
  count: number;
};

export default async function deduplicateCompanyAssociations() {
  // Delete duplicate company associations (when userId and companyId are duplicated )
  // Keep one association, ADMIN prefered if available
  // Duplicate may originate from bulk import script
  const duplicates: Duplicate[] =
    await prisma.$queryRaw`select "companyId", "userId", COUNT("companyId") from default$default."CompanyAssociation" group by   "companyId", "userId" having COUNT(*) > 1;`;
  let associationsToDelete: string[] = [];
  for (const duplicate of duplicates) {
    const asso = await prisma.companyAssociation.findMany({
      where: {
        user: {
          id: duplicate.userId
        },
        company: {
          id: duplicate.companyId
        }
      },
      orderBy: [{ role: "desc" }] // order by role to keep ADMIN first
    });

    const toDelete = asso.slice(1).map(a => a.id); // keep first item
    associationsToDelete = associationsToDelete.concat(toDelete);
  }

  await prisma.companyAssociation.deleteMany({
    where: {
      id: {
        in: associationsToDelete
      }
    }
  });
}
