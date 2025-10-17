import { RefinementCtx, z } from "zod";
import {
  isBroker,
  isBroyeur,
  isCollector,
  isDemolisseur,
  isTrader,
  isTransporter,
  isWasteCenter,
  isWasteProcessor,
  isWasteVehicles
} from "../../../companies/validation";
import { prisma } from "@td/prisma";
import { BsdType, Company, CompanyVerificationStatus } from "@prisma/client";
import { getOperationModesFromOperationCode } from "../../operationModes";
import { CompanyRole, pathFromCompanyRole } from "./schema";
import { v20250201 } from "../../validation";

import {
  ERROR_TRANSPORTER_PLATES_INCORRECT_LENGTH,
  ERROR_TRANSPORTER_PLATES_INCORRECT_FORMAT
} from "../messages";

const { VERIFY_COMPANY } = process.env;

export async function isTransporterRefinement(
  {
    siret,
    transporterRecepisseIsExempted,
    index
  }: {
    siret: string | null | undefined;
    transporterRecepisseIsExempted: boolean;
    index?: number;
  },
  ctx: RefinementCtx,
  checkIsNotDormant = true
) {
  if (transporterRecepisseIsExempted) return;

  const company = await refineSiretAndGetCompany(
    siret,
    ctx,
    CompanyRole.Transporter,
    checkIsNotDormant
  );

  if (company && !isTransporter(company)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: pathFromCompanyRole(CompanyRole.Transporter, index),
      message:
        `Le transporteur saisi sur le bordereau (SIRET: ${siret}) n'est pas inscrit sur Trackdéchets` +
        ` en tant qu'entreprise de transport. Cette entreprise ne peut donc pas être visée sur le bordereau.` +
        ` Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil` +
        ` de l'établissement depuis l'interface Trackdéchets dans Mes établissements`
    });
  }
}
export async function refineSiretAndGetCompany(
  siret: string | null | undefined,
  ctx: RefinementCtx,
  companyRole?: CompanyRole,
  checkIsNotDormant = true
): Promise<Company | null> {
  if (!siret) return null;
  const company = await prisma.company.findUnique({
    where: { siret }
  });

  if (company === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: pathFromCompanyRole(companyRole),
      message: `${
        companyRole ? `${companyRole} : ` : ""
      }L'établissement avec le SIRET ${siret} n'est pas inscrit sur Trackdéchets`
    });
  }

  if (checkIsNotDormant && company?.isDormantSince) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: pathFromCompanyRole(companyRole),
      message: `L'établissement avec le SIRET ${siret} est en sommeil sur Trackdéchets, il n'est pas possible de le mentionner sur un bordereau`
    });
  }

  return company;
}

export async function refineAndGetEcoOrganisme(
  siret: string | null | undefined,
  ctx: RefinementCtx,
  checkIsNotDormant = true
) {
  if (!siret) return null;
  const ecoOrganisme = await prisma.ecoOrganisme.findUnique({
    where: { siret }
  });

  if (ecoOrganisme === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ecoOrganisme", "siret"],
      message: `L'éco-organisme avec le SIRET ${siret} n'est pas référencé sur Trackdéchets`
    });
  }

  if (checkIsNotDormant) {
    const company = await prisma.company.findUnique({
      where: { siret }
    });

    if (company?.isDormantSince) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: pathFromCompanyRole(CompanyRole.EcoOrganisme),
        message: `L'établissement avec le SIRET ${siret} est en sommeil sur Trackdéchets, il n'est pas possible de le mentionner sur un bordereau`
      });
    }
  }

  return ecoOrganisme;
}

export const isRegisteredVatNumberRefinement = async (
  vatNumber: string | null | undefined,
  ctx: RefinementCtx
) => {
  if (!vatNumber) return;
  const company = await prisma.company.findUnique({
    where: { vatNumber }
  });
  if (company === null) {
    return ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: pathFromCompanyRole(CompanyRole.Transporter),
      message: `Le transporteur avec le n°de TVA ${vatNumber} n'est pas inscrit sur Trackdéchets`
    });
  }
  if (!isTransporter(company)) {
    return ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: pathFromCompanyRole(CompanyRole.Transporter),
      message:
        `Le transporteur saisi sur le bordereau (numéro de TVA: ${vatNumber}) n'est pas inscrit sur Trackdéchets` +
        ` en tant qu'entreprise de transport. Cette entreprise ne peut donc pas être visée sur le bordereau.` +
        ` Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil` +
        ` de l'établissement depuis l'interface Trackdéchets dans Mes établissements`
    });
  }
};
export async function isDestinationRefinement(
  siret: string | null | undefined,
  ctx: RefinementCtx,
  role:
    | "DESTINATION"
    | "WASTE_VEHICLES"
    | "BROYEUR"
    | "DEMOLISSEUR" = "DESTINATION",
  bsdCompanyRole: CompanyRole = CompanyRole.Destination,
  isExemptedFromVerification?: (destination: Company | null) => boolean,
  checkIsNotDormant = true
) {
  const company = await refineSiretAndGetCompany(
    siret,
    ctx,
    bsdCompanyRole,
    checkIsNotDormant
  );
  if (company) {
    if (
      role === "WASTE_VEHICLES" ||
      role === "BROYEUR" ||
      role === "DEMOLISSEUR"
    ) {
      if (!isWasteVehicles(company)) {
        return ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: pathFromCompanyRole(bsdCompanyRole),
          message: `Cet établissement n'a pas le profil Installation de traitement de VHU.`
        });
      }
      if (role === "BROYEUR" && !isBroyeur(company)) {
        return ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: pathFromCompanyRole(bsdCompanyRole),
          message: `Cet établissement n'a pas le sous-profil Broyeur.`
        });
      }
      if (role === "DEMOLISSEUR" && !isDemolisseur(company)) {
        return ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: pathFromCompanyRole(bsdCompanyRole),
          message: `Cet établissement n'a pas le sous-profil Casse automobile / démolisseur.`
        });
      }
    } else if (
      !isCollector(company) &&
      !isWasteProcessor(company) &&
      !isWasteCenter(company) &&
      !isWasteVehicles(company)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: pathFromCompanyRole(bsdCompanyRole),
        message:
          `L'installation de destination ou d’entreposage ou de reconditionnement avec le SIRET "${siret}" n'est pas inscrite` +
          ` sur Trackdéchets en tant qu'installation de traitement ou de tri transit regroupement. Cette installation ne peut` +
          ` donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette installation pour qu'il` +
          ` modifie le profil de l'établissement depuis l'interface Trackdéchets dans Mes établissements`
      });
    }

    if (
      VERIFY_COMPANY === "true" &&
      company.verificationStatus !== CompanyVerificationStatus.VERIFIED
    ) {
      if (isExemptedFromVerification && isExemptedFromVerification(company)) {
        return true;
      }

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: pathFromCompanyRole(bsdCompanyRole),
        message:
          `Le compte de l'installation de destination ou d’entreposage ou de reconditionnement prévue` +
          ` avec le SIRET ${siret} n'a pas encore été vérifié. Cette installation ne peut pas être visée sur le bordereau.`
      });
    }
  }
}

export async function isEmitterRefinement(
  siret: string | null | undefined,
  bsdType: BsdType,
  ctx: RefinementCtx,
  isExemptedFromVerification = false,
  checkIsNotDormant = true
) {
  let company: Company | null = null;
  // if the emitter of the BSD has to be registered on TD, add the BSD type here
  if (bsdType === BsdType.BSVHU && !isExemptedFromVerification) {
    company = await refineSiretAndGetCompany(
      siret,
      ctx,
      CompanyRole.Emitter,
      checkIsNotDormant
    );
  } else {
    if (!siret) return null;
    company = await prisma.company.findUnique({
      where: { siret }
    });
  }

  if (checkIsNotDormant && company?.isDormantSince) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: pathFromCompanyRole(CompanyRole.Emitter),
      message: `L'établissement avec le SIRET ${siret} est en sommeil sur Trackdéchets, il n'est pas possible de le mentionner sur un bordereau`
    });
  }
}

export function destinationOperationModeRefinement(
  destinationOperationCode: string | null | undefined,
  destinationOperationMode: string | null | undefined,
  destinationOperationSignatureDate: Date | null | undefined,
  ctx: RefinementCtx
) {
  // Le BSD a déjà été signé. On ne vérifie plus le mode pour ne pas casser les BSDs legacy
  if (destinationOperationSignatureDate && destinationOperationCode) {
    return;
  }

  if (destinationOperationCode) {
    const modes = getOperationModesFromOperationCode(destinationOperationCode);

    if (modes.length && !destinationOperationMode) {
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: pathFromCompanyRole(CompanyRole.Destination),
        message: "Vous devez préciser un mode de traitement"
      });
    } else if (
      (modes.length &&
        destinationOperationMode &&
        !modes.includes(destinationOperationMode)) ||
      (!modes.length && destinationOperationMode)
    ) {
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: pathFromCompanyRole(CompanyRole.Destination),
        message:
          "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie"
      });
    }
  }
}

export async function isEcoOrganismeRefinement(
  siret: string | null | undefined,
  bsdType: BsdType,
  ctx: RefinementCtx,
  checkIsNotDormant = true
) {
  const ecoOrganisme = await refineAndGetEcoOrganisme(
    siret,
    ctx,
    checkIsNotDormant
  );

  if (ecoOrganisme) {
    if (bsdType === BsdType.BSDA && !ecoOrganisme.handleBsda) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: pathFromCompanyRole(CompanyRole.EcoOrganisme),
        message: `L'éco-organisme avec le SIRET ${siret} n'est pas autorisé à apparaitre sur un BSDA`
      });
    } else if (bsdType === BsdType.BSVHU && !ecoOrganisme.handleBsvhu) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: pathFromCompanyRole(CompanyRole.EcoOrganisme),
        message: `L'éco-organisme avec le SIRET ${siret} n'est pas autorisé à apparaitre sur un BSVHU`
      });
    } else if (bsdType === BsdType.BSDASRI && !ecoOrganisme.handleBsdasri) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: pathFromCompanyRole(CompanyRole.EcoOrganisme),
        message: `L'éco-organisme avec le SIRET ${siret} n'est pas autorisé à apparaitre sur un BSDASRI`
      });
    }
  }
}

export async function isBrokerRefinement(
  siret: string | null | undefined,
  ctx: RefinementCtx,
  checkIsNotDormant = true
) {
  if (!siret) return;
  const company = await refineSiretAndGetCompany(
    siret,
    ctx,
    CompanyRole.Broker,
    checkIsNotDormant
  );

  if (company && !isBroker(company)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: pathFromCompanyRole(CompanyRole.Broker),
      message: `Cet établissement n'a pas le profil Courtier.`
    });
  }
}

export async function isTraderRefinement(
  siret: string | null | undefined,
  ctx: RefinementCtx,
  checkIsNotDormant = true
) {
  const company = await refineSiretAndGetCompany(
    siret,
    ctx,
    CompanyRole.Trader,
    checkIsNotDormant
  );

  if (company && !isTrader(company)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: pathFromCompanyRole(CompanyRole.Trader),
      message: `Cet établissement n'a pas le profil Négociant.`
    });
  }
}

export const onlyWhiteSpace = (str: string) => !str.trim().length; // check whitespaces, tabs, newlines and invisible chars

export const validateTransporterPlates = (
  transporter,
  ctx: z.RefinementCtx,
  transporterIndex?: number
) => {
  const { transporterTransportPlates: plates } = transporter;
  const bsdCreatedAt = transporter.createdAt || new Date();

  const path =
    transporterIndex !== undefined
      ? ["transporters", transporterIndex, "transporter", "transport", "plates"]
      : ["transporter", "transport", "plates"];

  const createdAfterV20250201 = bsdCreatedAt.getTime() > v20250201.getTime();

  if (!createdAfterV20250201 || !plates) {
    return;
  }
  if (plates.some(plate => plate.length > 12 || plate.length < 4)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: ERROR_TRANSPORTER_PLATES_INCORRECT_LENGTH,
      path
    });
    return;
  }

  if (plates.some(plate => onlyWhiteSpace(plate))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: ERROR_TRANSPORTER_PLATES_INCORRECT_FORMAT,
      path
    });
  }
};

export const validateMultiTransporterPlates = (bsd, ctx: z.RefinementCtx) => {
  const bsdCreatedAt = bsd.createdAt || new Date();

  const createdAfterV20250201 = bsdCreatedAt.getTime() > v20250201.getTime();

  if (!createdAfterV20250201) {
    return;
  }

  for (const [index, transporter] of (bsd.transporters ?? []).entries()) {
    validateTransporterPlates(transporter, ctx, index);
  }
};
