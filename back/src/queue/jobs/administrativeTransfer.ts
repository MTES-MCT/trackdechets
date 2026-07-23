import { logger } from "@td/logger";
import { prisma } from "@td/prisma";
import { Job } from "bull";
import { getFormRepository } from "../../forms/repository";
import { AuthType } from "../../auth/auth";
import { getBsdaRepository } from "../../bsda/repository";
import { getBsffRepository } from "../../bsffs/repository";

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

  // BSDAs
  const bsdaRepository = getBsdaRepository({
    auth: AuthType.Bearer,
    id: "JOB_ADMINISTRATIVE_TRANSFER",
    name: "JOB_ADMINISTRATIVE_TRANSFER"
  } as Express.User);

  await bsdaRepository.updateMany(
    {
      destinationCompanySiret: fromOrgId,
      status: "AWAITING_CHILD"
    },
    {
      destinationCompanySiret: toCompany.orgId,
      destinationCompanyName: toCompany.name,
      destinationCompanyAddress: toCompany.address,
      destinationCompanyContact: toCompany.contact,
      destinationCompanyMail: toCompany.contactEmail,
      destinationCompanyPhone: toCompany.contactPhone
    }
  );

  // ============================================
  // BSFFs
  // ============================================
  logger.info(`[BSFF] Starting BSFF transfer...`);

  // Vérifier d'abord combien de BSFF il y a
  const bsffToTransfer = await prisma.bsff.findMany({
    where: {
      destinationCompanySiret: fromOrgId,
      status: "INTERMEDIATELY_PROCESSED"
    },
    select: { id: true, destinationCompanySiret: true, status: true }
  });

  logger.info(
    `[BSFF] Found ${bsffToTransfer.length} BSFF with status INTERMEDIATELY_PROCESSED`
  );

  if (bsffToTransfer.length > 0) {
    logger.info(`[BSFF] BSFF IDs: ${bsffToTransfer.map(b => b.id).join(", ")}`);

    const bsffRepository = getBsffRepository({
      auth: AuthType.Bearer,
      id: "JOB_ADMINISTRATIVE_TRANSFER",
      name: "JOB_ADMINISTRATIVE_TRANSFER"
    } as Express.User);

    try {
      logger.info(
        `[BSFF] Calling updateMany with where: destinationCompanySiret=${fromOrgId}, status=INTERMEDIATELY_PROCESSED`
      );

      await bsffRepository.updateMany({
        where: {
          destinationCompanySiret: fromOrgId,
          status: "INTERMEDIATELY_PROCESSED"
        },
        data: {
          destinationCompanySiret: toCompany.orgId,
          destinationCompanyName: toCompany.name,
          destinationCompanyAddress: toCompany.address,
          destinationCompanyContact: toCompany.contact,
          destinationCompanyMail: toCompany.contactEmail,
          destinationCompanyPhone: toCompany.contactPhone
        }
      });

      logger.info(
        `[BSFF] Successfully transferred ${bsffToTransfer.length} BSFF`
      );

      // Vérifier après le transfert
      const bsffAfterTransfer = await prisma.bsff.findMany({
        where: {
          destinationCompanySiret: toCompany.orgId,
          id: { in: bsffToTransfer.map(b => b.id) }
        },
        select: { id: true, destinationCompanySiret: true }
      });

      logger.info(
        `[BSFF] Verification: ${bsffAfterTransfer.length} BSFF now point to ${toCompany.orgId}`
      );
    } catch (error) {
      logger.error(`[BSFF] Error transferring BSFF: ${error.message}`);
      logger.error(`[BSFF] Stack trace: ${error.stack}`);
      throw error;
    }
  } else {
    logger.info(`[BSFF] No BSFF to transfer`);
  }

  logger.info(
    `Administrative transfer completed successfully from ${fromOrgId} to ${toOrgId}`
  );
}
