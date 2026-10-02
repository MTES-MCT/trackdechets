import type {
  Bsff,
  BsffDetenteur,
  BsffFicheIntervention,
  BsffPackaging,
  FormCompany
} from "@td/codegen-back";
import { BsffType } from "@td/prisma";

export const FICHE_INTERVENTION_EXEMPTION =
  "Exemption au titre R.543-82 du code de l'environnement";

type EquipmentHoldersBsff = Pick<
  Bsff,
  "type" | "emitter" | "ficheInterventions"
> & { packagings: BsffPackaging[] };

export type EquipmentHolderRow = {
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

const isSameDetenteur = (
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

const hasCompanyValue = (company?: FormCompany | null) =>
  Boolean(
    company &&
      Object.values(company).some(value =>
        typeof value === "string" ? Boolean(value.trim()) : Boolean(value)
      )
  );

/**
 * Builds the PDF rows from packaging assignments. Intervention sheets are
 * optional metadata and remain a fallback for legacy BSFFs.
 */
export function getEquipmentHolderRows(
  bsff: EquipmentHoldersBsff
): EquipmentHolderRow[] {
  const rows: EquipmentHolderRow[] = [];
  const displayedFicheIds = new Set<string>();
  const isEquipmentHolderJourney =
    bsff.type === BsffType.COLLECTE_PETITES_QUANTITES ||
    bsff.type === BsffType.TRACER_FLUIDE;

  // Holders propagated through grouping/repackaging packagings are outside
  // this ticket. Keep the former intervention-sheet behaviour for those
  // journeys instead of introducing a new PDF section.
  if (!isEquipmentHolderJourney) {
    return bsff.ficheInterventions
      .filter(
        (
          ficheIntervention
        ): ficheIntervention is BsffFicheIntervention & {
          detenteur: BsffDetenteur;
        } => Boolean(ficheIntervention.detenteur)
      )
      .map(ficheIntervention => ({
        packaging: ficheIntervention.packagings?.[0],
        detenteur: ficheIntervention.detenteur,
        ficheIntervention
      }));
  }

  for (const packaging of bsff.packagings) {
    const packagingFiches = getPackagingFiches(
      packaging,
      bsff.ficheInterventions
    );
    let detenteurs = (packaging.detenteurs ?? []).filter(
      (detenteur): detenteur is BsffDetenteur => Boolean(detenteur?.company)
    );

    if (detenteurs.length === 0) {
      detenteurs = packagingFiches
        .map(fiche => fiche.detenteur)
        .filter((detenteur): detenteur is BsffDetenteur =>
          Boolean(detenteur?.company)
        );
    }

    if (
      detenteurs.length === 0 &&
      bsff.type === BsffType.TRACER_FLUIDE &&
      hasCompanyValue(bsff.emitter?.company)
    ) {
      detenteurs = [
        {
          isPrivateIndividual: false,
          company: bsff.emitter?.company
        }
      ];
    }

    for (const detenteur of detenteurs) {
      let matchingFiches = packagingFiches.filter(fiche =>
        isSameDetenteur(detenteur, fiche.detenteur)
      );

      if (
        matchingFiches.length === 0 &&
        detenteurs.length === 1 &&
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
  }

  // Older BSFFs can have intervention sheets without packaging relations.
  for (const ficheIntervention of bsff.ficheInterventions) {
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
}

export function formatFicheIntervention(
  ficheIntervention: BsffFicheIntervention | undefined,
  bsffType: Bsff["type"]
) {
  const numero = ficheIntervention?.numero?.trim();
  if (numero) return numero;

  return bsffType === BsffType.COLLECTE_PETITES_QUANTITES &&
    ficheIntervention?.isExempted
    ? FICHE_INTERVENTION_EXEMPTION
    : "";
}

const compact = (values: Array<string | null | undefined>) =>
  values
    .map(value => value?.trim())
    .filter((value): value is string => !!value);

export function formatEquipmentHolderIdentification(detenteur: BsffDetenteur) {
  const company = detenteur.company;
  if (!company) return "";

  if (detenteur.isPrivateIndividual) {
    return company.name?.trim() || company.contact?.trim() || "";
  }

  const identifier = companyIdentifier(company)?.trim();
  const name = company.name?.trim();
  return compact([
    identifier,
    normalize(identifier) === normalize(name) ? undefined : name
  ]).join(" - ");
}

export function formatEquipmentHolderContact(detenteur: BsffDetenteur) {
  return compact([detenteur.company?.contact, detenteur.company?.mail]).join(
    " - "
  );
}
