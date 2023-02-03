/**
 * Checks if the BSD is awaiting a specific signature type
 * Some signatures may be skipped in some situation so we need to checks recursively in
 * the signature hierarchy
 * For example if the "EMISSION" signature has been skipped because the emitter
 * is a private individual we want `isAwaitingSignature("EMISSION", bsda)` to return
 * false when another signature (ex: TRANSPORT) has been made
 */
export function isAwaitingSignature(type: BsdaSignatureType, bsda: Bsda) {
  const signature = SIGNATURES_HIERARCHY[type];
  if (bsda[signature.field]) {
    return false;
  }
  if (signature.next) {
    return isAwaitingSignature(signature.next, bsda);
  }
  return true;
}
