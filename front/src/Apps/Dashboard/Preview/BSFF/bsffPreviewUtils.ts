import {
  Bsff,
  BsffDetenteur,
  BsffFicheIntervention,
  BsffPackaging,
  BsffType,
  FormCompany
} from "@td/codegen-ui";

type BsffPreviewActors = Pick<
  Bsff,
  "type" | "emitter" | "packagings" | "ficheInterventions"
>;

export type BsffDetainerRow = {
  packaging?: BsffPackaging;
  detenteur: BsffDetenteur;
  ficheIntervention?: BsffFicheIntervention;
};

const normalize = (value?: string | null) => value?.trim().toLowerCase() ?? "";

const companyIdentifier = (company?: FormCompany | null) =>
  company?.siret ??
  company?.orgId ??
  company?.vatNumber ??
  company?.omiNumber ??
  company?.extraEuropeanId;

export const isSameDetenteur = (
  first?: BsffDetenteur | null,
  second?: BsffDetenteur | null
) => {
  if (!first?.company || !second?.company) return false;

  const firstIdentifier = companyIdentifier(first.company);
  const secondIdentifier = companyIdentifier(second.company);

  if (firstIdentifier && secondIdentifier) {
    return normalize(firstIdentifier) === normalize(secondIdentifier);
  }

  return (
    first.isPrivateIndividual === second.isPrivateIndividual &&
    normalize(first.company.name) === normalize(second.company.name) &&
    normalize(first.company.address) === normalize(second.company.address)
  );
};

const getPackagingFiches = (
  packaging: BsffPackaging,
  ficheInterventions: BsffFicheIntervention[]
) => {
  const fichesById = new Map(
    ficheInterventions.map(fiche => [fiche.id, fiche])
  );

  return (packaging.ficheInterventions ?? []).map(
    fiche => fichesById.get(fiche.id) ?? fiche
  );
};

const appendPackagingHolderRows = (
  packaging: BsffPackaging,
  packagingDetenteurs: BsffDetenteur[],
  packagingFiches: BsffFicheIntervention[],
  rows: BsffDetainerRow[],
  displayedFicheIds: Set<string>
): void => {
  for (const detenteur of packagingDetenteurs) {
    let matchingFiches = packagingFiches.filter(fiche =>
      isSameDetenteur(detenteur, fiche.detenteur)
    );

    // Legacy data may contain the relation without enough identity data
    // to perform the match. A one-to-one relation is unambiguous.
    if (
      matchingFiches.length === 0 &&
      packagingDetenteurs.length === 1 &&
      packagingFiches.length === 1
    ) {
      matchingFiches = packagingFiches;
    }

    if (matchingFiches.length === 0) {
      rows.push({ packaging, detenteur });
    } else {
      for (const ficheIntervention of matchingFiches) {
        displayedFicheIds.add(ficheIntervention.id);
        rows.push({ packaging, detenteur, ficheIntervention });
      }
    }
  }
};

/**
 * The packaging owns the holder assignment. The intervention sheet only
 * enriches that assignment and remains a fallback for legacy BSFFs.
 */
export const getBsffDetainerRows = (
  bsd: Pick<BsffPreviewActors, "packagings" | "ficheInterventions">
): BsffDetainerRow[] => {
  const rows: BsffDetainerRow[] = [];
  const displayedFicheIds = new Set<string>();

  for (const packaging of bsd.packagings ?? []) {
    const packagingFiches = getPackagingFiches(
      packaging,
      bsd.ficheInterventions ?? []
    );
    const packagingDetenteurs = (packaging.detenteurs ?? []).filter(
      (detenteur): detenteur is BsffDetenteur => Boolean(detenteur?.company)
    );

    if (packagingDetenteurs.length > 0) {
      appendPackagingHolderRows(
        packaging,
        packagingDetenteurs,
        packagingFiches,
        rows,
        displayedFicheIds
      );
      continue;
    }

    // Compatibility fallback for BSFFs created before holders were stored on
    // packagings.
    for (const ficheIntervention of packagingFiches) {
      if (ficheIntervention.detenteur) {
        displayedFicheIds.add(ficheIntervention.id);
        rows.push({
          packaging,
          detenteur: ficheIntervention.detenteur,
          ficheIntervention
        });
      }
    }
  }

  // Preserve the former preview for legacy, unassociated intervention sheets.
  for (const ficheIntervention of bsd.ficheInterventions ?? []) {
    if (
      ficheIntervention.detenteur &&
      !displayedFicheIds.has(ficheIntervention.id)
    ) {
      rows.push({
        packaging: ficheIntervention.packagings?.[0],
        detenteur: ficheIntervention.detenteur,
        ficheIntervention
      });
    }
  }

  return rows;
};

export const getBsffPreviewActorTabs = (bsd: BsffPreviewActors) => {
  const detainerRows = getBsffDetainerRows(bsd);
  const emitterAsDetenteur: BsffDetenteur = {
    isPrivateIndividual: false,
    company: bsd.emitter?.company
  };
  const hasDifferentEquipmentHolder = detainerRows.some(
    row => !isSameDetenteur(row.detenteur, emitterAsDetenteur)
  );
  const showProducer =
    bsd.type === BsffType.CollectePetitesQuantites
      ? detainerRows.length > 0
      : bsd.type === BsffType.TracerFluide && hasDifferentEquipmentHolder;

  const emitterLabel =
    bsd.type === BsffType.CollectePetitesQuantites
      ? "Opérateur"
      : bsd.type === BsffType.TracerFluide
      ? "Détenteur"
      : "Installation de tri, transit, regroupement";

  return [
    { tabId: "emetteur", label: emitterLabel },
    ...(showProducer ? [{ tabId: "detenteur", label: "Producteur" }] : [])
  ];
};
