// for event logging
type BsdPrefix =
  | "Bsdasri"
  | "Bsvhu"
  | "Bsda"
  | "Bsff"
  | "BsffFicheIntervention"
  | "Bspaoh"
  | "";

export type eventTypes = {
  created: `${BsdPrefix}Created`;
  updated: `${BsdPrefix}Updated`;
  deleted: `${BsdPrefix}Deleted`;
  signed: `${BsdPrefix}Signed`;
};
