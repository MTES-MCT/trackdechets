import { Job } from "bull";
import { updateAppendix2Fn } from "../../forms/updateAppendix2";
import { logger } from "@td/logger";
import { AuthType } from "../../auth";
import { prisma } from "@td/prisma";

export type UpdateAppendix2JobArgs = {
  // Identifiant du bordereau initial annexé à un bordereau de regroupement
  // dont on souhaite mettre à jour les infos
  formId: string;
  // Identifiant de l'utilisateur à l'origine de l'update
  userId: string;
  // Méthode de connextion de l'utilisateur à l'origine de l'update
  auth: AuthType;
};

/**
 * Ce job permet de mettre à jour les champs `statut` et `quantityGrouped`
 * d'un BSDD annexé à un bordereau de regroupement lors de la création, édition,
 * suppression et traitement du bordereau de regroupement.
 * @param job
 */
export async function updateAppendix2Job(
  job: Job<UpdateAppendix2JobArgs>
): Promise<void> {
  logger.info(`Updating appendix2 ${job.data.formId}`);
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: job.data.userId }
  });
  await updateAppendix2Fn(job.data, {
    ...user,
    auth: job.data.auth
  });
}
