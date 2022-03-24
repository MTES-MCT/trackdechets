import prisma from "../../prisma";

export default async function deleteOrphanCompanies() {
  const orphanCompanies = await prisma.company.findMany({
    where: { companyAssociations: { none: {} } }
  });
  await prisma.company.deleteMany({
    where: { id: { in: orphanCompanies.map(c => c.id) } }
  });
}
