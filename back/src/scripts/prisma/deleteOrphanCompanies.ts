import { prisma } from "@td/prisma";

export default async function deleteOrphanCompanies() {
  const orphanCompanies: { id: string }[] =
    await prisma.$queryRaw`SELECT "default$default"."Company"."id" AS "id"
    FROM "default$default"."Company"
    LEFT JOIN "default$default"."CompanyAssociation" "Company Association"
    ON "default$default"."Company"."id" = "Company Association"."companyId"
    WHERE ("Company Association"."id" IS NULL
    OR "Company Association"."id" = '')`;

  await prisma.membershipRequest.deleteMany({
    where: { companyId: { in: orphanCompanies.map(c => c.id) } }
  });
  await prisma.company.deleteMany({
    where: { id: { in: orphanCompanies.map(c => c.id) } }
  });
}
