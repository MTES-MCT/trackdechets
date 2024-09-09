import { Job } from "bull";
import { updateAppendix2Fn } from "../../forms/updateAppendix2";

export type UpdateAppendix2JobArgs = {
  // Identifiant du bordereau initial annexé à un bordereau de regroupement
  // dont on souhaite mettre à jour les infos
  formId: string;
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
  await updateAppendix2Fn(job.data);
}
