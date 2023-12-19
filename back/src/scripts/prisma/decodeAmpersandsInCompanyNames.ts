import { prisma } from "@td/prisma";

export default async function decodeAmpersandsInCompanyNames() {
  const companies = await prisma.company.findMany({
    where: { name: { contains: "&amp;" } }
  });

  for (const company of companies) {
    await prisma.company.update({
      where: { id: company.id },
      data: { name: company.name.replace("&amp;", "&") }
    });
  }
}
