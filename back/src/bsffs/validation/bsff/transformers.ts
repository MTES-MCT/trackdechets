import {
  BsffValidationContext,
  ZodBsffTransformer,
  ZodBsffTransporterTransformer
} from "./types";
import { BsffType } from "@td/prisma";
import { checkPreviousPackagings } from "./refinements";
import { recipifyTransporter } from "../../../common/validation/zod/transformers";
import { ParsedZodBsff } from "./schema";
import { sirenifyBsff } from "./sirenify";
import { recipifyBsff } from "./recipify";
import { getSealedFields } from "./rules";

const toDetenteurInput = (detenteur: {
  detenteurCompanyName: string;
  detenteurCompanySiret: string | null;
  detenteurCompanyAddress: string;
  detenteurCompanyContact: string | null;
  detenteurCompanyPhone: string | null;
  detenteurCompanyMail: string | null;
  detenteurIsPrivateIndividual: boolean;
}) => ({
  company: {
    name: detenteur.detenteurCompanyName,
    siret: detenteur.detenteurCompanySiret,
    address: detenteur.detenteurCompanyAddress,
    contact: detenteur.detenteurCompanyContact,
    phone: detenteur.detenteurCompanyPhone,
    mail: detenteur.detenteurCompanyMail
  },
  isPrivateIndividual: detenteur.detenteurIsPrivateIndividual
});

const uniqueDetenteurs = <T extends { company?: { siret?: string | null } }>(
  detenteurs: T[]
) =>
  detenteurs.filter(
    (detenteur, index) =>
      !detenteur.company?.siret ||
      detenteurs.findIndex(
        candidate => candidate.company?.siret === detenteur.company?.siret
      ) === index
  );

export const runTransformers = async (
  bsff: ParsedZodBsff,
  context: BsffValidationContext
): Promise<ParsedZodBsff> => {
  const transformers = [sirenifyBsff, recipifyBsff];
  const sealedFields = await getSealedFields(bsff, context);

  for (const transformer of transformers) {
    bsff = await transformer(bsff, sealedFields);
  }
  return bsff;
};

/**
 * Applique les vérifications sur les contenants à réexpédier / grouper / reconditionner puis applique
 * les transformations suivantes :
 * - Définit la valeur du champ `packagings` à partir des packagings qui sont regroupés / réexpédiés
 * - Convertir `grouping`, `repackaging` et `forwarding` en un seul champ `previousPackagings` sur les contenants.
 */
export const checkAndSetPreviousPackagings: ZodBsffTransformer = async (
  bsff,
  ctx
) => {
  const previousPackagings = await checkPreviousPackagings(bsff, ctx);

  const { forwarding, grouping, repackaging, ...rest } = bsff;

  if (
    bsff.type === BsffType.GROUPEMENT ||
    bsff.type === BsffType.REEXPEDITION
  ) {
    return {
      ...rest,
      packagings: previousPackagings.map(p => {
        const userPackaging = bsff.packagings?.find(
          up => up.numero === p.numero
        );
        return {
          type: p.type,
          other: p.other,
          numero: p.numero,
          emissionNumero: p.numero,
          volume: userPackaging?.volume ?? p.volume,
          weight: p.acceptationWeight ?? 0,
          operationNoTraceability: false,
          previousPackagings: [p.id],
          // FI and holder associations follow a packaging to ensure that a
          // group of packagings linked by one FI stays together over time.
          ficheInterventions: p.ficheInterventions.map(fi => fi.id),
          detenteurs: p.detenteurs.map(toDetenteurInput)
        };
      })
    };
  } else if (bsff.type === BsffType.RECONDITIONNEMENT) {
    return {
      ...rest,
      packagings: bsff.packagings?.map(p => ({
        ...p,
        previousPackagings: previousPackagings.map(p => p.id),
        ficheInterventions: [
          ...new Set(
            previousPackagings.flatMap(p =>
              p.ficheInterventions.map(fi => fi.id)
            )
          )
        ],
        detenteurs: uniqueDetenteurs(
          previousPackagings.flatMap(p => p.detenteurs.map(toDetenteurInput))
        )
      }))
    };
  }
  return rest;
};

export const updateTransporterRecepisse: ZodBsffTransporterTransformer =
  async bsffTransporter => recipifyTransporter(bsffTransporter);
