export const isStepDisabled = (emitter, transporter, siret, id): boolean => {
  if (!id) {
    return false;
  }
  const emitterSigned = emitter?.emission?.signature?.author;
  const transporterSigned = transporter?.transport?.signature?.author;
  const isEmitter = emitter?.company?.siret === siret;
  // emitter can still update any field after his own signature
  const disabledAfterEmission =
    (emitterSigned && !isEmitter) || transporterSigned;

  return disabledAfterEmission;
};
