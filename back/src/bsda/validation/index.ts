import { Company, Prisma, User } from "@prisma/client";
import { BsdaInput, BsdaSignatureType } from "../../generated/graphql/types";
import { applyDynamicRefinement } from "./dynamicRefinements";
import {
  getCompaniesFunctions,
  getSignatureAncestors,
  getUnparsedBsda,
  getUpdatedFields,
  getUserFunctions
} from "./helpers";
import { checkSealedAndRequiredFields, getSealedFields } from "./rules";
import { bsdaSchema } from "./schema";
import { runTransformers } from "./transformers";

export type BsdaValidationContext = {
  enablePreviousBsdasChecks?: boolean;
  enableCompletionTransformers?: boolean;
  currentSignatureType?: BsdaSignatureType;
  user?: User;
};

export type SyncBsdaValidationContext = { userCompanies: Company[] } & Pick<
  BsdaValidationContext,
  "currentSignatureType"
>;

export const BsdaForParsingInclude = Prisma.validator<Prisma.BsdaInclude>()({
  intermediaries: true,
  grouping: true,
  forwarding: true,
  transporters: true
});

type BsdaForParsing = Prisma.BsdaGetPayload<{
  include: typeof BsdaForParsingInclude;
}>;

export type UnparsedInputs = {
  input?: BsdaInput | undefined;
  persisted?: BsdaForParsing | undefined;
  isDraft?: boolean;
};

export async function parseBsdaInContext(
  unparsedInputs: UnparsedInputs,
  validationContext: BsdaValidationContext
) {
  const unparsedBsda = getUnparsedBsda(unparsedInputs);
  const updatedFields = getUpdatedFields(unparsedInputs);
  // Some signatures may be skipped, so always check all the hierarchy
  const signaturesToCheck = getSignatureAncestors(
    validationContext.currentSignatureType
  );
  const userFunctions = await getUserFunctions(
    validationContext.user,
    unparsedBsda
  );

  const contextualSchema = bsdaSchema
    .transform(async val => {
      const sealedFields = getSealedFields({
        bsda: val,
        persistedBsda: unparsedInputs.persisted,
        userFunctions,
        signaturesToCheck
      });
      if (validationContext.enableCompletionTransformers) {
        val = await runTransformers(val, sealedFields);
      }

      return val;
    })
    .superRefine(async (val, ctx) => {
      checkSealedAndRequiredFields(
        {
          bsda: val,
          persistedBsda: unparsedInputs.persisted,
          updatedFields,
          userFunctions,
          signaturesToCheck
        },
        ctx
      );

      await applyDynamicRefinement(val, validationContext, ctx);
    });

  const zodBsda = await contextualSchema.parseAsync(unparsedBsda);

  const {
    transporterCompanySiret,
    transporterCompanyName,
    transporterCompanyVatNumber,
    transporterCompanyAddress,
    transporterCompanyContact,
    transporterCompanyPhone,
    transporterCompanyMail,
    transporterCustomInfo,
    transporterRecepisseIsExempted,
    transporterRecepisseNumber,
    transporterRecepisseDepartment,
    transporterRecepisseValidityLimit,
    transporterTransportMode,
    transporterTransportPlates,
    transporterTransportTakenOverAt,
    transporterTransportSignatureAuthor,
    transporterTransportSignatureDate,
    transporterId,
    ...bsda
  } = zodBsda;

  // Au niveau du schéma Zod, tout se passe comme si les données de transport
  // était encore "à plat" avec un seul transporteur (en attendant l'implémentation du multi-modal)
  // On renvoie séparement les données du bsda et les données du transporteur
  // car elles font ensuite l'objet de traitement séparé pour construire les payloads de création / update
  return {
    bsda: { ...bsda, transporterTransportSignatureDate },
    transporter: {
      id: transporterId,
      transporterCompanySiret,
      transporterCompanyName,
      transporterCompanyVatNumber,
      transporterCompanyAddress,
      transporterCompanyContact,
      transporterCompanyPhone,
      transporterCompanyMail,
      transporterCustomInfo,
      transporterRecepisseIsExempted,
      transporterRecepisseNumber,
      transporterRecepisseDepartment,
      transporterRecepisseValidityLimit,
      transporterTransportMode,
      transporterTransportPlates,
      transporterTransportTakenOverAt,
      transporterTransportSignatureAuthor,
      transporterTransportSignatureDate
    }
  };
}

/**
 * This is a sync equivalent of parseBsdaInContext.
 * Being sync obviously means that dynamic parsing & transformation cannot be applied.
 * This is for use cases where we need to validate a batch of bsdas quickly.
 *
 * @param unparsedInputs
 * @param validationContext
 * @param userCompanies
 * @returns
 */
export function syncParseBsdaInContext(
  unparsedInputs: UnparsedInputs,
  validationContext: SyncBsdaValidationContext
) {
  const unparsedBsda = getUnparsedBsda(unparsedInputs);
  const updatedFields = getUpdatedFields(unparsedInputs);
  // Some signatures may be skipped, so always check all the hierarchy
  const signaturesToCheck = getSignatureAncestors(
    validationContext.currentSignatureType
  );
  const userFunctions = getCompaniesFunctions(
    validationContext.userCompanies,
    unparsedBsda
  );

  const contextualSchema = bsdaSchema.superRefine((val, ctx) => {
    checkSealedAndRequiredFields(
      {
        bsda: val,
        persistedBsda: unparsedInputs.persisted,
        updatedFields,
        userFunctions,
        signaturesToCheck
      },
      ctx
    );
  });

  return contextualSchema.parse(unparsedBsda);
}
