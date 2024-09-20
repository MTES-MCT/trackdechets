import { logger } from "@td/logger";
import { prisma } from "@td/prisma";
import { Job } from "bull";
import { getFormRepository } from "../../forms/repository";
import { AuthType } from "../../auth";

export type AdministrativeTransferArgs = { fromOrgId: string; toOrgId: string };

export async function processAdministrativeTransferJob(
  job: Job<AdministrativeTransferArgs>
): Promise<void> {
  logger.info(
    `Processing administrative transfer with BSDs from org "${job.data.fromOrgId}" to org "${job.data.toOrgId}"`
  );

  const { fromOrgId, toOrgId } = job.data;

  const toCompany = await prisma.company.findUniqueOrThrow({
    where: { orgId: toOrgId }
  });

  // BSDDs
  const bsddsToTransfer = await prisma.form.findMany({
    where: {
      recipientCompanySiret: fromOrgId,
      status: {
        in: ["AWAITING_GROUP"]
      }
    },
    select: { id: true }
  });

  const formRepository = getFormRepository({
    auth: AuthType.Bearer,
    id: "JOB_ADMINISTRATIVE_TRANSFER",
    name: "JOB_ADMINISTRATIVE_TRANSFER"
  } as Express.User);

  await formRepository.updateMany(
    bsddsToTransfer.map(bsdd => bsdd.id),
    {
      recipientCompanySiret: toCompany.orgId,
      recipientCompanyName: toCompany.name,
      recipientCompanyAddress: toCompany.address,
      recipientCompanyContact: toCompany.contact,
      recipientCompanyMail: toCompany.contactEmail,
      recipientCompanyPhone: toCompany.contactPhone
    }
  );

  // Later on, other types of BSDs...
}
