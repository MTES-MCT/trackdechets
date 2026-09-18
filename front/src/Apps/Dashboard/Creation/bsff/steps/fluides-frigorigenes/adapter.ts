import { BSFF_WASTES } from "@td/constants";
import { BsffPackagingType } from "@td/codegen-ui";
import { emptyBsffPackaging } from "../../../../../Forms/Components/PackagingList/helpers";
import { ZodBsff, ZodWasteCodeEnum } from "../../schema";
import { getBsffPackagingsTotalWeight } from "../../utils/waste";
import { FluidesFrigorigenesDto } from "./api";
import { FluidesFrigorigenesIntervention } from "./model";

type ImportedBsffField =
  | "waste"
  | "packagings"
  | "weight"
  | "ficheInterventions"
  | "fluidesFrigorigenesImport";

export type FluidesFrigorigenesBsffImport = {
  [Field in ImportedBsffField]: NonNullable<ZodBsff[Field]>;
};

export class FluidesFrigorigenesImportError extends Error {}

export function adaptFluidesFrigorigenesIntervention(
  dto: FluidesFrigorigenesDto
): FluidesFrigorigenesIntervention {
  const wasteCodes = [
    ...new Set(dto.dechets.map(({ codeDechet }) => codeDechet))
  ].sort((a, b) => a.localeCompare(b));

  return {
    id: dto.ffFicheId,
    number: dto.ficheInterventionNumero,
    wasteCodes,
    equipmentHolder: dto.detenteur.nom,
    holder: {
      siret: dto.detenteur.siret,
      name: dto.detenteur.nom,
      address: dto.detenteur.adresse,
      postalCode: dto.detenteur.codePostal,
      city: dto.detenteur.ville
    },
    weightKg: dto.dechets.reduce(
      (total, { poidsFluide }) => total + poidsFluide,
      0
    ),
    interventionDate: dto.dateIntervention?.slice(0, 10),
    isAssociated: dto.associatedBsffIds.length > 0,
    containers: dto.dechets.map(container => ({
      id: container.bouteilleId,
      number: container.bouteilleIdentification,
      wasteCode: container.codeDechet,
      adr: container.mentionADR ?? undefined,
      weightKg: container.poidsFluide,
      volumeLiters: container.volumeContenant ?? undefined
    }))
  };
}

export function adaptFluidesFrigorigenesToBsffImport(
  interventions: FluidesFrigorigenesIntervention[]
): FluidesFrigorigenesBsffImport {
  const wasteCodes = [
    ...new Set(
      interventions.flatMap(intervention =>
        intervention.containers.map(container => container.wasteCode)
      )
    )
  ];

  if (wasteCodes.length !== 1) {
    throw new FluidesFrigorigenesImportError(
      "L'import doit contenir un unique code déchet."
    );
  }

  const parsedWasteCode = ZodWasteCodeEnum.safeParse(wasteCodes[0]);
  if (!parsedWasteCode.success || !parsedWasteCode.data) {
    throw new FluidesFrigorigenesImportError(
      `Le code déchet ${wasteCodes[0]} n'est pas autorisé pour un BSFF.`
    );
  }
  const waste = BSFF_WASTES.find(({ code }) => code === parsedWasteCode.data);
  if (!waste) {
    throw new FluidesFrigorigenesImportError(
      `Le code déchet ${wasteCodes[0]} n'est pas autorisé pour un BSFF.`
    );
  }
  const packagings = interventions.flatMap(intervention =>
    intervention.containers.map(container => ({
      type: BsffPackagingType.Bouteille,
      numero: container.number,
      weight: container.weightKg,
      volume: emptyBsffPackaging.volume ?? 0,
      other: emptyBsffPackaging.other ?? ""
    }))
  );

  return {
    waste: {
      code: parsedWasteCode.data,
      description: waste.description,
      adr: interventions
        .flatMap(intervention => intervention.containers)
        .map(container => container.adr)
        .filter((adr): adr is string => Boolean(adr))
        .join(", ")
    },
    packagings,
    weight: {
      value: getBsffPackagingsTotalWeight(packagings),
      isEstimate: false
    },
    fluidesFrigorigenesImport: {
      selectedInterventionIds: interventions.map(
        intervention => intervention.id
      ),
      interventions: interventions.map(intervention => ({
        id: intervention.id,
        number: intervention.number,
        packagingNumbers: intervention.containers.map(
          container => container.number
        )
      }))
    },
    ficheInterventions: interventions.map(intervention => {
      const isPrivateIndividual = !intervention.holder.siret.trim();

      return {
        numero: intervention.number,
        isExempted: false,
        holderType: isPrivateIndividual ? "PARTICULIER" : "ENTREPRISE",
        identification: "",
        postalCode: intervention.holder.postalCode ?? "",
        detenteur: {
          isPrivateIndividual,
          company: {
            siret: isPrivateIndividual ? null : intervention.holder.siret,
            name: intervention.holder.name,
            address: intervention.holder.address ?? "",
            contact: isPrivateIndividual ? intervention.holder.name : "",
            phone: "",
            mail: ""
          }
        },
        packagings: intervention.containers.map(container => ({
          numero: container.number
        }))
      };
    })
  };
}
