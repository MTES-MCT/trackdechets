import { Prisma, Form, Status, User, EmitterType } from "@prisma/client";
import { safeInput } from "../common/converter";
import { objectDiff } from "../forms/workflow/diff";
import { UpdateFormInput } from "../generated/graphql/types";
import {
  flattenFormInput,
  flattenTemporaryStorageDetailInput
} from "./converter";
import { getUserRoles } from "../permissions";
import { SealedFieldError } from "../common/errors";
import { getFirstTransporterSync } from "./database";
import { FullForm } from "./types";
import { prisma } from "@td/prisma";
import { Decimal } from "decimal.js";

type EditableBsddFields = Required<
  Omit<
    Prisma.FormCreateInput,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "rowNumber"
    | "readableId"
    | "status"
    | "emittedBy"
    | "emittedAt"
    | "emittedByEcoOrganisme"
    | "takenOverBy"
    | "takenOverAt"
    | "sentAt"
    | "sentBy"
    | "isAccepted"
    | "receivedAt"
    | "quantityReceived"
    | "quantityRefused"
    | "quantityReceivedType"
    | "hasCiterneBeenWashedOut"
    | "citerneNotWashedOutReason"
    | "processingOperationDone"
    | "destinationOperationMode"
    | "isDeleted"
    | "receivedBy"
    | "processedBy"
    | "processedAt"
    | "nextDestinationProcessingOperation"
    | "processingOperationDescription"
    | "noTraceability"
    | "signedByTransporter"
    | "nextDestinationCompanyName"
    | "nextDestinationCompanySiret"
    | "nextDestinationCompanyAddress"
    | "nextDestinationCompanyContact"
    | "nextDestinationCompanyPhone"
    | "nextDestinationCompanyMail"
    | "nextDestinationCompanyCountry"
    | "nextDestinationCompanyVatNumber"
    | "nextDestinationCompanyExtraEuropeanId"
    | "nextDestinationNotificationNumber"
    | "nextDestinationProcessingOperation"
    | "wasteAcceptationStatus"
    | "wasteRefusalReason"
    | "signedAt"
    | "currentTransporterOrgId"
    | "nextTransporterOrgId"
    | "isImportedFromPaper"
    | "signedBy"
    | "transportSegments"
    | "groupedIn"
    | "ownerId"
    | "owner"
    | "StatusLog"
    | "bsddRevisionRequests"
    | "recipientsSirets"
    | "transportersSirets"
    | "intermediariesSirets"
    | "canAccessDraftSirets"
    | "forwarding"
    | "quantityGrouped"
    | "finalOperations"
    | "FinalOperationToFinalForm"
    | "emptyReturnADR"
    | "registryLookups"
  >
>;

// Defines until which signature BSDD fields can be modified
// The test in edition.test.ts ensures that every possible key in UpdateFormInput
// has a corresponding edition rule
export const editionRules: {
  [Key in keyof EditableBsddFields]: BsddSignatureType;
} = {
  customId: "EMISSION",
  emitterType: "EMISSION",
  emitterPickupSite: "EMISSION",
  emitterWorkSiteName: "EMISSION",
  emitterWorkSiteAddress: "EMISSION",
  emitterWorkSiteCity: "EMISSION",
  emitterWorkSitePostalCode: "EMISSION",
  emitterWorkSiteInfos: "EMISSION",
  emitterIsPrivateIndividual: "EMISSION",
  emitterIsForeignShip: "EMISSION",
  emitterCompanyName: "EMISSION",
  emitterCompanySiret: "EMISSION",
  emitterCompanyAddress: "EMISSION",
  emitterCompanyContact: "EMISSION",
  emitterCompanyPhone: "EMISSION",
  emitterCompanyMail: "EMISSION",
  emitterCompanyOmiNumber: "EMISSION",
  recipientCap: "EMISSION",
  recipientProcessingOperation: "EMISSION",
  recipientIsTempStorage: "EMISSION",
  recipientCompanyName: "EMISSION",
  recipientCompanySiret: "EMISSION",
  recipientCompanyAddress: "EMISSION",
  recipientCompanyContact: "EMISSION",
  recipientCompanyPhone: "EMISSION",
  recipientCompanyMail: "EMISSION",
  wasteDetailsCode: "EMISSION",
  wasteDetailsOnuCode: "EMISSION",
  wasteDetailsIsSubjectToADR: "EMISSION",
  wasteDetailsNonRoadRegulationMention: "EMISSION",
  wasteDetailsPackagingInfos: "EMISSION",
  wasteDetailsQuantity: "EMISSION",
  wasteDetailsQuantityType: "EMISSION",
  wasteDetailsName: "EMISSION",
  wasteDetailsConsistence: "EMISSION",
  wasteDetailsPop: "EMISSION",
  wasteDetailsIsDangerous: "EMISSION",
  wasteDetailsParcelNumbers: "EMISSION",
  wasteDetailsAnalysisReferences: "EMISSION",
  wasteDetailsLandIdentifiers: "EMISSION",
  wasteDetailsSampleNumber: "TRANSPORT",
  traderCompanyName: "EMISSION",
  traderCompanySiret: "EMISSION",
  traderCompanyAddress: "EMISSION",
  traderCompanyContact: "EMISSION",
  traderCompanyPhone: "EMISSION",
  traderCompanyMail: "EMISSION",
  traderReceipt: "EMISSION",
  traderDepartment: "EMISSION",
  traderValidityLimit: "EMISSION",
  brokerCompanyName: "EMISSION",
  brokerCompanySiret: "EMISSION",
  brokerCompanyAddress: "EMISSION",
  brokerCompanyContact: "EMISSION",
  brokerCompanyPhone: "EMISSION",
  brokerCompanyMail: "EMISSION",
  brokerReceipt: "EMISSION",
  brokerDepartment: "EMISSION",
  brokerValidityLimit: "EMISSION",
  ecoOrganismeName: "EMISSION",
  ecoOrganismeSiret: "EMISSION",
  grouping: "EMISSION",
  transporters: "RECEPTION",
  forwardedIn: "EMISSION",
  intermediaries: "EMISSION"
};

export async function checkEditionRules(
  form: FullForm,
  input: UpdateFormInput,
  user: User
) {
  const sealedFieldErrors: string[] = [];

  if ([Status.DRAFT, Status.SEALED].includes(form.status)) {
    // Tant que le bordereau n'a pas été signé, tous les champs sont modifiables
    return true;
  }

  if (form.status === Status.SIGNED_BY_PRODUCER) {
    // L'emetteur ou l'éco-organisme (s'il signé à la place de l'émetteur)
    // peuvent encore modifier tous les champs tant qu'aucune autre signature
    // n'a eu lieu

    const userSirets = Object.keys(await getUserRoles(user.id));

    const isEmitter =
      form.emitterCompanySiret && userSirets.includes(form.emitterCompanySiret);

    if (!form.emittedByEcoOrganisme && isEmitter) {
      // L'émetteur du bordereau peut modifier tous les champs tant qu'il
      // est le seul à avoir signé
      return true;
    }

    const isEcoOrganisme =
      form.ecoOrganismeSiret && userSirets.includes(form.ecoOrganismeSiret);

    if (form.emittedByEcoOrganisme && isEcoOrganisme) {
      // L'éco-organisme peut modifier tous les champs du bordereau
      // tant qu'il est le seul à avoir signé
      return true;
    }

    if (form.emitterType === EmitterType.APPENDIX1_PRODUCER) {
      const isTransporter =
        form.transporters[0]?.transporterCompanySiret &&
        userSirets.includes(form.transporters[0].transporterCompanySiret);

      if (isTransporter) {
        // Le transporteur peut modifier les données de l'annexe 1 jusqu'à sa signature
        return true;
      }
    }
  }

  if (
    form.emitterType === EmitterType.APPENDIX1 &&
    form.status === Status.SENT
  ) {
    // Benoit : j'ai repris ici le comportement qui était implémenté dans permissions.checkCanUpdate
    // Il faut peut-être l'améliorer avec une gestion plus fine de ce qui est modifiable.
    //
    // D'après Orion :
    // > Il faut pouvoir ajouter des annexes 1 au chapeau meme quand il est SENT.
    // > Au cours de ma collecte, je peux rajouter des producteurs à aller voir.
    // > Donc il faut pouvoir le modifier - plus précisément modifier les bordereaux groupés.
    // > Peut être qu'il faudrait une gestion plus fine des champs modifiables, c'est à checker.
    return true;
  }

  const updatedFields = await getUpdatedFields(form, input);

  function checkSealedFields(
    signatureType: BsddSignatureType | null,
    editableFields: string[]
  ) {
    if (signatureType === null) {
      return checkSealedFields(
        "EMISSION",
        editableFields.filter(field => editionRules[field] !== "EMISSION")
      );
    }
    if (isAwaitingSignature(signatureType, form)) {
      // do not perform additional checks if we are still awaiting
      // for this signature type
      return true;
    }
    for (const field of updatedFields) {
      if (!editableFields.includes(field)) {
        sealedFieldErrors.push(field);
      }
    }
    const signature = SIGNATURES_HIERARCHY[signatureType];

    if (signature.next) {
      return checkSealedFields(
        signature.next,
        editableFields.filter(field => editionRules[field] !== signature.next)
      );
    }
  }

  checkSealedFields(null, Object.keys(editionRules));

  // Effectue une vérification spécifique pour le champ `transporter`
  if (input.transporter) {
    const firstTransporter = getFirstTransporterSync(form);
    if (firstTransporter && firstTransporter.takenOverAt) {
      sealedFieldErrors.push("transporter");
    }
  }

  // Effectue une vérification spécifique pour le champ `transporters`
  if (
    input.transporters &&
    // if form has been received, the error is already catched by `checkSealedFields`
    !sealedFieldErrors.includes("transporters")
  ) {
    // Vérifie que l'on n'est pas en train de supprimer ou permuter l'ordre d'un
    // transporteur qui a déjà signé
    form.transporters.forEach((transporter, idx) => {
      if (transporter.takenOverAt) {
        const updatedTransporterId = input.transporters![idx];
        if (!updatedTransporterId || updatedTransporterId !== transporter.id) {
          sealedFieldErrors.push(`transporters[${idx}]`);
        }
      }
    });
  }

  if (sealedFieldErrors?.length > 0) {
    throw new SealedFieldError([...new Set(sealedFieldErrors)]);
  }

  return true;
}

/**
 * Computes all the fields that will be updated
 * If a field is present in the input but has the same value as the
 * data present in the DB, we do not return it as we want to
 * allow reposting fields if they are not modified
 */
export async function getUpdatedFields(
  form: FullForm,
  input: UpdateFormInput
): Promise<string[]> {
  const flatInput = safeInput(flattenFormInput(input));

  // only pick keys present in the input to compute the diff between
  // the input and the data in DB
  const compareTo = {
    ...Object.keys(flatInput).reduce((acc, field) => {
      return { ...acc, [field]: form[field] };
    }, {}),
    ...(input.transporters
      ? { transporters: form.transporters.map(t => t.id) }
      : {})
  };

  const diff = {
    ...objectDiff(flatInput, compareTo),
    ...intermediariesDiff(form, input),
    ...forwardedInDiff(form, input),
    ...(await groupingDiff(form, input))
  };

  return Object.keys(diff);
}

const stringsNonNullAndEqual = (str1, str2) => {
  return Boolean(str1) && Boolean(str2) && str1 === str2;
};

/**
 * Computes the diff on `intermediaries` input
 * This is not trivial because it is an array of `CompanyInput`
 */
function intermediariesDiff(
  form: FullForm,
  input: UpdateFormInput
): { intermediaries?: any } {
  const diff: { intermediaries?: any } = {};
  if (input.intermediaries) {
    const existingIntermediaries = form.intermediaries ?? [];
    if (input.intermediaries.length !== existingIntermediaries.length) {
      // un intermédiaire est ajouté ou supprimé, on ajoute une clé au diff
      diff.intermediaries = input.intermediaries;
    } else {
      for (const intermediary of existingIntermediaries) {
        const inputIntermediary = input.intermediaries.find(
          i =>
            stringsNonNullAndEqual(i.siret, intermediary.siret) ||
            stringsNonNullAndEqual(i.vatNumber, intermediary.vatNumber)
        );
        if (!inputIntermediary) {
          // un intermédiaire est présent dans l'input mais pas dans les données existantes
          diff.intermediaries = input.intermediaries;
          break;
        }
        // ces deux champs ne sont pas pris en compte lors de la création
        // des intermédiaires, on les exclut du calcul du diff
        delete inputIntermediary.country;
        delete inputIntermediary.omiNumber;

        const intermediaryDiff = objectDiff(inputIntermediary, {
          siret: intermediary.siret,
          vatNumber: intermediary.vatNumber,
          name: intermediary.name,
          address: intermediary.address,
          contact: intermediary.contact,
          mail: intermediary.mail,
          phone: intermediary.phone
        });
        if (Object.keys(intermediaryDiff).length > 0) {
          // les infos d'un intermédiaire au moins diffère
          diff.intermediaries = input.intermediaries;
          break;
        }
      }
    }
  }
  return diff;
}

/**
 * Computes the diff on the BSD suite
 */
function forwardedInDiff(
  form: FullForm,
  input: UpdateFormInput
): { forwardedIn?: any } {
  const diff: { forwardedIn?: any } = {};

  if (input.temporaryStorageDetail) {
    if (!form.forwardedIn) {
      // on ajoute un BSD suite sur un bordereau qui n'en avait pas initialement
      diff.forwardedIn = input.temporaryStorageDetail;
      return diff;
    }
    const flatForwardedInInput = flattenTemporaryStorageDetailInput(
      input.temporaryStorageDetail
    );
    const compareForwardedInTo = form.forwardedIn
      ? Object.keys(flatForwardedInInput).reduce((acc, field) => {
          return { ...acc, [field]: form.forwardedIn![field] };
        }, {})
      : {};

    const forwardedInDiff = objectDiff(
      flatForwardedInInput,
      compareForwardedInTo
    );
    if (Object.keys(forwardedInDiff).length > 0) {
      diff.forwardedIn = forwardedInDiff;
    }
  }
  return diff;
}

async function groupingDiff(
  form: FullForm,
  input: UpdateFormInput
): Promise<{ grouping?: any }> {
  if (input.appendix2Forms) {
    // Il n'est pas trivial de calculer le diff avec les fractions existantes
    // lorsque le champ `appendix2Forms` est envoyé car la quantité affectée
    // à chaque fraction est calculée plus loin dans le code à partir de la quantité
    // restante à regrouper sur chaque bordereau. De ce fait, on n'autorise pas sur
    // ce champ de renvoyer les infos lorsqu'il est verrouillé.
    return { grouping: input.appendix2Forms };
  }

  if (input.grouping) {
    const existingFormFractions = await prisma.form
      .findUniqueOrThrow({ where: { id: form.id } })
      .grouping({ include: { initialForm: true } });

    if (
      input.grouping.length !== (existingFormFractions ?? []).length ||
      !input.grouping.every(f =>
        existingFormFractions
          .map(fraction => fraction.initialFormId)
          .includes(f.form.id)
      )
    ) {
      // La liste des bordereaux annexés n'est pas la même
      return { grouping: input.grouping };
    }

    for (const fraction of input.grouping) {
      if (!fraction.quantity) {
        // Si l'on souhaite renvoyer les mêmes infos sur ce champ lorsqu'il est verrouillé
        // il faut passer les quantité explicitement
        return { grouping: input.grouping };
      }
      const quantity = new Decimal(fraction.quantity);
      const existingQuantity = existingFormFractions.find(
        f => f.initialFormId === fraction.form.id
      )!.quantity; // le test au dessus s'assure que `.find` retourne bien un élément ici
      if (!quantity.equals(existingQuantity)) {
        return { grouping: input.grouping };
      }
    }

    return {};
  }

  return {};
}

// BSDD cannot be updated through the mutation `updateForm` after form reception
type BsddSignatureType = "EMISSION" | "TRANSPORT" | "RECEPTION";

const SIGNATURES_HIERARCHY: {
  [key in BsddSignatureType]: {
    field: keyof Form;
    next?: BsddSignatureType;
  };
} = {
  EMISSION: { field: "emittedAt", next: "TRANSPORT" },
  TRANSPORT: {
    field: "takenOverAt",
    next: "RECEPTION"
  },
  RECEPTION: { field: "receivedAt" }
};

/**
 * Checks if the Form is awaiting a specific signature type
 */
export function isAwaitingSignature(type: BsddSignatureType, form: Form) {
  const signature = SIGNATURES_HIERARCHY[type];
  if (form[signature.field]) {
    return false;
  }
  if (signature.next) {
    return isAwaitingSignature(signature.next, form);
  }
  return true;
}
