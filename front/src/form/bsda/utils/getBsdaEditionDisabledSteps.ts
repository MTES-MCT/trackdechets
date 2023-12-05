import { Bsda } from "codegen-ui";

/**
 * BSDA Edition permissions
 * @param bsda BSDA current data
 * @param siret Current user SIRET editing the BSDA
 * @returns
 */

export function getBsdaEditionDisabledSteps(
  bsda: Bsda | undefined,
  siret: string
): {
  disabledAfterEmission: boolean;
  workerSigned: boolean;
  transporterSigned: boolean;
} {
  const transporterSigned =
    bsda?.transporter?.transport?.signature?.author != null;
  const workerSigned =
    bsda?.worker?.work?.signature?.author != null || transporterSigned;
  const emitterSigned =
    bsda?.emitter?.emission?.signature?.author != null || workerSigned;
  const isEmitter = bsda?.emitter?.company?.siret === siret;
  // emitter can still update any field after his own signature
  const disabledAfterEmission =
    (emitterSigned && !isEmitter) || transporterSigned;
  return { disabledAfterEmission, workerSigned, transporterSigned };
}
