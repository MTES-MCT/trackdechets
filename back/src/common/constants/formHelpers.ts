export const isBsddTransporterFieldEditable = status =>
  ["SEALED", "SIGNED_BY_PRODUCER"].includes(status);
