import { Job } from "bull";
import { operationHookFn as formOperationHookFn } from "../../forms/operationHook";
import { operationHookFn as bsdaOperationHookFn } from "../../bsda/operationHook";
import { operationHookFn as bsffOperationHookFn } from "../../bsffs/operationHook";
import { operationHookFn as bsdasriOperationHookFn } from "../../bsdasris/operationHook";
import { BsdType } from "@prisma/client";

export type OperationHookJobArgs = {
  bsdType: BsdType;
  // Identifiant d'un bordereau sur lequel on souhaite mettre à jour le traitement final.
  initialBsdId: string;
  // Identifiant du bordereau plus loin dans la chaîne de traçabailité ayant reçu l'opération finale.
  finalBsdId: string;
  // Code de l'opération finale (ou de regroupement avec perte de traçabilité)
  operationCode: string;
  // Perte de traçabilité (ce qui permet de considérer un code de regroupement comme final)
  noTraceability: boolean;
  // (Optionnel) Quantité à affecter au traitement final
  quantity?: number;
  // (Optionnel) Permet de pondérer la quantité par une fraction dans le cas où
  // il y a eu un groupement avec ventilation des quantités plus loin dans la
  // chaîne.
  fraction?: number;
};

export async function operationHookJob(
  job: Job<OperationHookJobArgs>
): Promise<void> {
  const bsdType = job.data.bsdType;
  if (bsdType === BsdType.BSDD) {
    await formOperationHookFn(job.data, { runSync: false });
  } else if (bsdType === BsdType.BSDA) {
    await bsdaOperationHookFn(job.data, { runSync: false });
  } else if (bsdType === BsdType.BSFF) {
    await bsffOperationHookFn(job.data, { runSync: false });
  } else if (bsdType === BsdType.BSDASRI) {
    await bsdasriOperationHookFn(job.data, { runSync: false });
  } else {
    throw new Error(`Operation hook is not handled for bsd type ${bsdType}`);
  }
}
