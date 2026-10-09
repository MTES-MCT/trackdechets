import { BsffType } from "@td/codegen-ui";
import {
  getDetenteurKey,
  findInitialDetenteurCompletion,
  mergeInitialDetenteurs,
  hasBsffInitialValue
} from "@td/constants";
import { ZodBsff } from "../schema";

export type InitialDetenteur = {
  isPrivateIndividual?: boolean | null;
  company?: NonNullable<
    NonNullable<ZodBsff["ficheInterventions"]>[number]["detenteur"]
  >["company"];
};

export type InitialContainer = {
  id?: string | null;
  numero?: string | null;
  detenteurs?: InitialDetenteur[] | null;
  ficheInterventions?: { detenteur?: InitialDetenteur | null }[] | null;
  bsff?: {
    id?: string | null;
    ficheInterventions?: { detenteur?: InitialDetenteur | null }[] | null;
  };
};

export const usesInitialDetenteurs = (type?: string | null) =>
  type === BsffType.Reconditionnement || type === BsffType.Groupement;

export const hasInitialValue = hasBsffInitialValue;

export function getInitialDetenteurs(container: InitialContainer) {
  const linked = [
    ...(container.detenteurs ?? []),
    ...(container.ficheInterventions ?? []).flatMap(fiche =>
      fiche.detenteur ? [fiche.detenteur] : []
    )
  ];
  return mergeInitialDetenteurs(linked);
}

type FormHolder = NonNullable<ZodBsff["ficheInterventions"]>[number];

/** Existing RG8 mapping, shared by grouping and reconditioning. */
export function buildInitialDetenteurs(
  containers: InitialContainer[],
  current: FormHolder[] = []
): FormHolder[] {
  const grouped = new Map<string, FormHolder>();
  const initial = mergeInitialDetenteurs(
    containers.flatMap(getInitialDetenteurs)
  );
  containers.forEach(container => {
    getInitialDetenteurs(container).forEach((holder, index) => {
      const key =
        getDetenteurKey(holder) ??
        `SOURCE|${container.id ?? container.numero}|${index}`;
      const company = holder.company ?? {};
      let mapped = grouped.get(key);
      if (!mapped) {
        const sameSource = current.filter(fiche => fiche.sourceKey === key);
        const completion = findInitialDetenteurCompletion(
          holder,
          initial,
          current.flatMap(fiche => (fiche.detenteur ? [fiche.detenteur] : []))
        );
        const previous =
          sameSource.length === 1
            ? sameSource[0]
            : completion
            ? current.find(fiche => fiche.detenteur === completion)
            : undefined;
        mapped = {
          sourceKey: key,
          isExempted: false,
          detenteur: {
            isPrivateIndividual:
              holder.isPrivateIndividual ??
              previous?.detenteur?.isPrivateIndividual ??
              undefined,
            company: { ...previous?.detenteur?.company }
          },
          lockedFields: [],
          packagings: []
        };
        grouped.set(key, mapped);
      }
      if (
        hasInitialValue(holder.isPrivateIndividual) &&
        !mapped.lockedFields!.includes("isPrivateIndividual")
      ) {
        mapped.lockedFields!.push("isPrivateIndividual");
      }
      // Filled source values win; missing values preserve manual completions.
      for (const field of [
        "orgId",
        "siret",
        "vatNumber",
        "name",
        "address",
        "contact",
        "phone",
        "mail"
      ] as const) {
        if (
          hasInitialValue(company[field]) &&
          !mapped.lockedFields!.includes(field)
        ) {
          mapped.detenteur!.company![field] = company[field];
          mapped.lockedFields!.push(field);
        }
      }
      if (
        (container.id || container.numero) &&
        !mapped.packagings!.some(p =>
          container.id ? p.id === container.id : p.numero === container.numero
        )
      ) {
        mapped.packagings!.push({
          id: container.id,
          numero: container.numero ?? ""
        });
      }
    });
  });
  return Array.from(grouped.values()).map((holder, index) => ({
    ...holder,
    numero: `${index + 1}`
  }));
}
