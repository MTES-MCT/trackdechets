import { prisma } from "../../generated/prisma-client";

/**
 * Copy column processedAt (String) into column processedAtDateTime (DateTime)
 */
export default async function setProcessedAtDateTime() {
  const forms = await prisma.forms({ where: { processedAt_not: null } });
  for (const form of forms) {
    await prisma.updateForm({
      where: { id: form.id },
      data: { processedAtDateTime: form.processedAt }
    });
  }
}
