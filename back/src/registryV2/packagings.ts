type PackagingLike = {
  type: string;
  quantity?: number | null;
  other?: string | null;
};

export const BSDA_PACKAGING_LABELS: Record<string, string> = {
  BIG_BAG: "Big-bag / GRV",
  DEPOT_BAG: "Dépôt-bag",
  PALETTE_FILME: "Palette filmée",
  SAC_RENFORCE: "Sac renforcé",
  CONTENEUR_BAG: "Conteneur-bag",
  OTHER: "Autre"
};

export const BSDASRI_PACKAGING_LABELS: Record<string, string> = {
  BOITE_CARTON: "Caisse(s) en carton avec sac en plastique",
  FUT: "Fût(s)",
  BOITE_PERFORANTS: "Boîte(s) et Mini-collecteurs pour déchets perforants",
  GRAND_EMBALLAGE: "Grand(s) emballage(s)",
  GRV: "Grand(s) récipient(s) pour vrac",
  AUTRE: "Autre(s)"
};

export const BSFF_PACKAGING_LABELS: Record<string, string> = {
  BOUTEILLE: "Bouteille",
  CITERNE: "Citerne",
  CONTENEUR: "Conteneur",
  AUTRE: "Autre"
};

export const BSPAOH_PACKAGING_LABELS: Record<string, string> = {
  RELIQUAIRE: "Reliquaire",
  LITTLE_BOX: "Petite boîte",
  BIG_BOX: "Grande boîte"
};

export const BSVHU_PACKAGING_LABELS: Record<string, string> = {
  UNITE: "unités",
  LOT: "lots"
};

export const BSDD_PACKAGING_LABELS: Record<string, string> = {
  FUT: "Fût",
  GRV: "Grand Récipient Vrac (GRV)",
  CITERNE: "Citerne",
  BENNE: "Benne",
  PIPELINE: "Conditionné pour pipeline",
  AUTRE: "Autre"
};

export function formatGroupedPackagingQuantity(
  packagings: PackagingLike[] | null | undefined,
  labels: Record<string, string>,
  options?: {
    otherType?: string;
    useQuantityField?: boolean;
  }
) {
  if (!packagings?.length) {
    return null;
  }

  const otherType = options?.otherType ?? "AUTRE";
  const grouped = new Map<string, number>();

  for (const packaging of packagings) {
    const baseLabel = labels[packaging.type] ?? packaging.type;

    const type =
      packaging.type === otherType
        ? `${baseLabel}${packaging.other ? ` (${packaging.other})` : ""}`
        : baseLabel;

    const quantity = options?.useQuantityField ? packaging.quantity ?? 0 : 1;

    grouped.set(type, (grouped.get(type) ?? 0) + quantity);
  }

  return [...grouped.entries()]
    .map(([type, quantity]) => `${quantity}: ${type}`)
    .join(" | ");
}

export function formatSinglePackagingQuantity(
  quantity: number | null | undefined,
  packaging: string | null | undefined,
  labels: Record<string, string>
) {
  if (quantity == null) {
    return null;
  }

  const label = packaging ? labels[packaging] ?? packaging : "";

  return label ? `${quantity}: ${label}` : `${quantity}`;
}
