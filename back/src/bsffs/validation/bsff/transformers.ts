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
import { completeInitialDetenteurs } from "./detenteurs";
import {
  hasBsffInitialValue,
  mergeInitialDetenteurs,
  getDetenteurKey
} from "@td/constants";

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
  const initialDetenteurs = mergeInitialDetenteurs(
    previousPackagings.flatMap(source => [
      ...source.detenteurs.map(toDetenteurInput),
      ...source.ficheInterventions.map(toDetenteurInput)
    ])
  );

  if (
    bsff.type === BsffType.GROUPEMENT ||
    bsff.type === BsffType.RECONDITIONNEMENT
  ) {
    const first = previousPackagings.find(
      p => p.id === (grouping?.[0] ?? repackaging?.[0])
    );
    const originalWaste = {
      wasteCode: [first?.acceptationWasteCode, first?.bsff?.wasteCode].find(
        hasBsffInitialValue
      ),
      wasteDescription: [
        first?.acceptationWasteDescription,
        first?.bsff?.wasteDescription
      ].find(hasBsffInitialValue),
      wasteAdr: first?.bsff?.wasteAdr
    };
    for (const field of [
      "wasteCode",
      "wasteDescription",
      "wasteAdr"
    ] as const) {
      if (hasBsffInitialValue(originalWaste[field])) {
        // The database source is authoritative; drafts may omit these fields.
        Object.assign(rest, { [field]: originalWaste[field] });
      }
    }
  }

  if (
    bsff.type === BsffType.GROUPEMENT ||
    bsff.type === BsffType.REEXPEDITION
  ) {
    return {
      ...rest,
      ...(bsff.type === BsffType.GROUPEMENT
        ? {
            weightValue: previousPackagings.reduce(
              (sum, p) => sum + (p.acceptationWeight ?? p.weight ?? 0),
              0
            )
          }
        : {}),
      packagings: previousPackagings.map(p => {
        const numbered =
          bsff.packagings?.filter(up => !up.id && up.numero === p.numero) ?? [];
        const userPackaging =
          bsff.type === BsffType.GROUPEMENT
            ? bsff.packagings?.find(up => up.id === p.id) ??
              (p.nextPackagingId
                ? bsff.packagings?.find(up => up.id === p.nextPackagingId)
                : undefined) ??
              (previousPackagings.filter(source => source.numero === p.numero)
                .length === 1
                ? numbered.length === 1
                  ? numbered[0]
                  : undefined
                : undefined)
            : bsff.packagings?.find(up => up.numero === p.numero);
        if (
          bsff.type === BsffType.GROUPEMENT &&
          !userPackaging &&
          numbered.length
        ) {
          ctx.addIssue({
            code: "custom",
            message:
              "Le numéro du contenant est ambigu : renseignez son identifiant pour conserver ses associations",
            path: ["packagings"]
          });
        }
        return {
          type: p.type,
          other:
            bsff.type === BsffType.GROUPEMENT && !hasBsffInitialValue(p.other)
              ? userPackaging?.other ?? p.other
              : p.other,
          numero:
            bsff.type === BsffType.GROUPEMENT && !hasBsffInitialValue(p.numero)
              ? userPackaging?.numero ?? p.numero
              : p.numero,
          emissionNumero:
            bsff.type === BsffType.GROUPEMENT && !hasBsffInitialValue(p.numero)
              ? userPackaging?.numero ?? p.numero
              : p.numero,
          volume:
            bsff.type === BsffType.GROUPEMENT
              ? p.volume ?? userPackaging?.volume
              : userPackaging?.volume ?? p.volume,
          weight:
            bsff.type === BsffType.GROUPEMENT
              ? p.acceptationWeight ?? p.weight ?? userPackaging?.weight ?? 0
              : p.acceptationWeight ?? 0,
          operationNoTraceability: false,
          previousPackagings: [p.id],
          // FI and holder associations follow a packaging to ensure that a
          // group of packagings linked by one FI stays together over time.
          ficheInterventions: p.ficheInterventions.map(fi => fi.id),
          detenteurs:
            bsff.type === BsffType.GROUPEMENT
              ? completeInitialDetenteurs(
                  mergeInitialDetenteurs([
                    ...p.detenteurs.map(toDetenteurInput),
                    ...p.ficheInterventions.map(toDetenteurInput)
                  ]).map(
                    holder =>
                      mergeInitialDetenteurs([
                        holder,
                        ...initialDetenteurs.filter(
                          candidate =>
                            getDetenteurKey(holder) !== null &&
                            getDetenteurKey(candidate) ===
                              getDetenteurKey(holder)
                        )
                      ])[0]
                  ),
                  userPackaging?.detenteurs ?? [],
                  initialDetenteurs
                )
              : p.detenteurs.map(toDetenteurInput)
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
        detenteurs: completeInitialDetenteurs(
          initialDetenteurs,
          p.detenteurs ?? []
        )
      }))
    };
  }
  return rest;
};

export const updateTransporterRecepisse: ZodBsffTransporterTransformer =
  async bsffTransporter => recipifyTransporter(bsffTransporter);
