import { RefinementCtx, z } from "zod";

import type { BspaohSignatureType } from "@td/codegen-back";
import { BspaohValidationContext } from "./index";
import { ZodBspaoh, ZodFullBspaoh } from "./schema";
import { distinct } from "../../common/arrays";
import { CompanyVerificationStatus } from "@prisma/client";
import { hasCremationProfile } from "../../companies/validation";
import {
  isTransporterRefinement,
  refineSiretAndGetCompany
} from "../../common/validation/zod/refinement";
import {
  CompanyRole,
  pathFromCompanyRole
} from "../../common/validation/zod/schema";

const { VERIFY_COMPANY } = process.env;

export async function applyDynamicRefinement(
  bspaoh: ZodFullBspaoh,
  validationContext: BspaohValidationContext,
  ctx: RefinementCtx
) {
  await isTransporterRefinement(
    {
      siret: bspaoh.transporterCompanySiret,
      transporterRecepisseIsExempted: bspaoh.transporterRecepisseIsExempted
    },
    ctx
  );

  validatePackagingsReception(
    bspaoh,
    validationContext.currentSignatureType,
    ctx
  );
  validateWeightFields(bspaoh, validationContext.currentSignatureType, ctx);
}

/**
 *
 * IOT receive a PAOH, we have to check `destinationReceptionWastePackagingsAcceptation` against `wastePackagings`
 * At update time, We check:
 * - there are no duplicate ids
 * - reception ids exists in packagings ids
 * At signature time, we check:
 * - update checks +
 * - all ids are present
 * - there is not more acceptation items than packaging items
 * - there is no pending statuses left
 * - if bsd is accepted, all packages must be accepted
 * - if bsd is refused, all packages must be refused
 * - if bsd is paratially refused, all packages must be partially refused
 * @param ctx
 * @returns
 */
function validatePackagingsReception(
  bspaoh: ZodBspaoh,
  currentSignatureType: BspaohSignatureType | undefined,
  ctx: RefinementCtx
) {
  const {
    wastePackagings,
    destinationReceptionWastePackagingsAcceptation,
    destinationReceptionAcceptationStatus
  } = bspaoh;
  const packagingsIds = wastePackagings.map(p => p.id);
  const receptionPackagingsIds =
    destinationReceptionWastePackagingsAcceptation.map(p => p.id);

  // are there duplicate ids in reception packaging payload ?
  const duplicateReceptionIds =
    distinct(receptionPackagingsIds).length < receptionPackagingsIds.length;

  if (!!receptionPackagingsIds.length && duplicateReceptionIds) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["destination", "reception", "acceptation", "packagings"],
      message: `Les informations d'acceptation de packagings comportent des identifiants en doublon`
    });
  }
  // are there reception packaging ids not existing in wastePackagings ?

  const allReceptionPackagingsIdsExists = receptionPackagingsIds.every(
    element => packagingsIds.includes(element)
  );
  if (!!receptionPackagingsIds.length && !allReceptionPackagingsIdsExists) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["destination", "reception", "acceptation", "packagings"],
      message: `Les informations d'acceptation de packagings ne correspondent pas aux packagings`
    });
  }

  if (currentSignatureType !== "RECEPTION") {
    return;
  }

  const receptionPackagingsStatuses =
    destinationReceptionWastePackagingsAcceptation.map(p => p.acceptation);

  if (receptionPackagingsIds.length > packagingsIds.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["destination", "reception", "acceptation", "packagings"],
      message: `Les informations d'acceptation de packagings ne correspondent pas aux packagings`
    });
  }
  // all wastePackagings have a matching receptionPackaging?
  const allIdsPresents =
    !!receptionPackagingsIds.length &&
    packagingsIds.every(element => receptionPackagingsIds.includes(element));

  // are there remaining PENDING statuses at signature time ?
  const remainingPending = receptionPackagingsStatuses.includes("PENDING");
  if (!allIdsPresents || remainingPending) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["destination", "reception", "acceptation", "status"],
      message: `Le statut d'acceptation de tous les packagings doit être précisé`
    });
    return;
  }

  const deduplicatedStatuses = distinct(receptionPackagingsStatuses);

  const allAccepted =
    deduplicatedStatuses.length === 1 && deduplicatedStatuses[0] === "ACCEPTED";
  const allRefused =
    deduplicatedStatuses.length === 1 && deduplicatedStatuses[0] === "REFUSED";

  if (destinationReceptionAcceptationStatus === "ACCEPTED" && !allAccepted) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["destination", "reception", "acceptation", "status"],
      message: `Le bordereau ne peut être accepté que si tous les packagings sont acceptés`
    });
    return;
  }
  if (destinationReceptionAcceptationStatus === "REFUSED" && !allRefused) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["destination", "reception", "acceptation", "status"],
      message: `Le bordereau ne peut être refusé si tous les packagings ne sont pas refusés`
    });
    return;
  }
  if (
    destinationReceptionAcceptationStatus === "PARTIALLY_REFUSED" &&
    (allRefused || allAccepted)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["destination", "reception", "acceptation", "status"],
      message: `Le bordereau ne peut être partiellement refusé si tous les packagings sont refusés ou acceptés`
    });
  }
}

function validateWeightFields(
  bspaoh: ZodBspaoh,
  currentSignatureType: BspaohSignatureType | undefined,
  ctx: RefinementCtx
) {
  // received weight is required to fill accepted/refused weights
  if (
    !bspaoh.destinationReceptionWasteReceivedWeightValue &&
    !!bspaoh.destinationReceptionWasteRefusedWeightValue
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["destination", "reception", "detail", "receivedWeight"],
      message: `Le poids reçu est requis pour renseigner le poid refusé`
    });
  }

  if (
    (bspaoh.destinationReceptionWasteRefusedWeightValue ?? 0) >
    (bspaoh.destinationReceptionWasteReceivedWeightValue ?? 0)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["destination", "reception", "detail", "refusedWeight"],
      message: `Le poids refusé ne eut être supérieur au poids accepté`
    });
  }

  // no refused weight if PAOH is accepted
  if (
    bspaoh.destinationReceptionWasteRefusedWeightValue &&
    bspaoh.destinationReceptionAcceptationStatus === "ACCEPTED"
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["destination", "reception", "detail", "refusedWeight"],
      message: `Le poids refusé ne peut être renseigné si le PAOH est accepté`
    });
  }
}
export async function isCrematoriumRefinement(siret: string, ctx) {
  const company = await refineSiretAndGetCompany(siret, ctx);
  if (company && !hasCremationProfile(company)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: pathFromCompanyRole({ companyRole: CompanyRole.Destination }),
      message:
        `L'entreprise avec le SIRET "${siret}" n'est pas inscrite` +
        ` sur Trackdéchets en tant que crématorium. Cette installation ne peut` +
        ` donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette installation pour qu'il` +
        ` modifie le profil de l'établissement depuis l'interface Trackdéchets dans Mes établissements`
    });
  }
  if (
    company &&
    VERIFY_COMPANY === "true" &&
    company.verificationStatus !== CompanyVerificationStatus.VERIFIED
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: pathFromCompanyRole({ companyRole: CompanyRole.Destination }),
      message:
        `Le compte de l'installation du crématorium` +
        ` avec le SIRET ${siret} n'a pas encore été vérifié. Cette installation ne peut pas être visée sur le bordereau.`
    });
  }
}
