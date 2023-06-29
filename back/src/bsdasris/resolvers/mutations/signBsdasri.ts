import {
  MutationSignBsdasriArgs,
  MutationResolvers,
  BsdasriSignatureType,
  BsdasriSignatureInput,
  SignatureAuthor
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import {
  Bsdasri,
  BsdasriStatus,
  BsdasriType,
  Prisma,
  WasteAcceptationStatus
} from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsdasriOrNotFound } from "../../database";
import { expandBsdasriFromDB } from "../../converter";
import { checkCanEditBsdasri } from "../../permissions";
import { UserInputError } from "apollo-server-core";
import { getTransporterCompanyOrgId } from "../../../common/constants/companySearchHelpers";
import { FullDbBsdasri } from "../../types";
import { validateBsdasri } from "../../validation";
import { getNextStatus } from "../../workflow/dasriTransition";
import {
  Permission,
  can,
  getUserRoles,
  checkCanSignFor
} from "../../../permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { runInTransaction } from "../../../common/repository/helper";
import { BsdasriRepository, getBsdasriRepository } from "../../repository";
import { getTransporterReceipt } from "../../recipify";

const signBsdasri: MutationResolvers["signBsdasri"] = async (
  _,
  { id, input }: MutationSignBsdasriArgs,
  context: GraphQLContext
) => {
  const user = checkIsAuthenticated(context);
  const existingBsdasri = await getBsdasriOrNotFound({
    id,
    includeAssociated: true
  });
  checkCanEditBsdasri(existingBsdasri);

  const authorizedOrgIds = getAuthorizedOrgIds(existingBsdasri, input.type);
  await checkCanSignFor(user, input.type, authorizedOrgIds);

  const sign = signatures[input.type];
  const signedBsdasri = await sign(user, existingBsdasri, input);
  return expandBsdasriFromDB(signedBsdasri);
};

export default signBsdasri;

/**
 * Returns the different companies allowed to perform the signature
 * @param bsdasri the BSDASRI we wante to sign
 * @param signatureType the type of signature (ex: EMISSION, TRANSPORT, etc)
 * @param signatureAuthor EMITTER or ECO_ORGANISME (for signature with secret code only)
 * @returns a list of organisation identifiers
 */
export function getAuthorizedOrgIds(
  bsdasri: Bsdasri,
  signatureType: BsdasriSignatureType,
  signatureAuthor?: SignatureAuthor
): string[] {
  function getEmissionAuthorizedOrgIds(dasri: Bsdasri) {
    if (dasri.type === BsdasriType.SIMPLE) {
      if (signatureAuthor && signatureAuthor === "EMITTER") {
        return [dasri.emitterCompanySiret];
      } else if (signatureAuthor && signatureAuthor === "ECO_ORGANISME") {
        return [dasri.ecoOrganismeSiret];
      }
      return [dasri.ecoOrganismeSiret, dasri.emitterCompanySiret];
    }
    return [dasri.emitterCompanySiret];
  }

  const signatureTypeToFn = {
    EMISSION: (bsdasri: Bsdasri) => getEmissionAuthorizedOrgIds(bsdasri),
    TRANSPORT: (bsdasri: Bsdasri) => [getTransporterCompanyOrgId(bsdasri)],
    RECEPTION: (bsdasri: Bsdasri) => [bsdasri.destinationCompanySiret],
    OPERATION: (bsdasri: Bsdasri) => [bsdasri.destinationCompanySiret]
  };

  const getAuthorizedSiretsFn = signatureTypeToFn[signatureType];

  return getAuthorizedSiretsFn(bsdasri).filter(Boolean);
}

// Defines different signature function based on signature type
const signatures: Record<
  BsdasriSignatureType,
  (
    user: Express.User,
    bsdasri: Bsdasri,
    input: BsdasriSignatureInput & { signatureAuthor?: SignatureAuthor }
  ) => Promise<Bsdasri>
> = {
  EMISSION: signEmission,
  TRANSPORT: signTransport,
  RECEPTION: signReception,
  OPERATION: signOperation
};

/**
 * Sign the emission of the BSDASRI
 * @param user the user who is performing the signature
 * @param bsdasri the BSDASRI under signature
 * @param input the signature info, including `securityCode` and `signatureAuthor`
 * for signature with secret code (see mutation `signEmissionWithSecretCode`)
 * @returns the signed BSDASRI
 *
 */
export async function signEmission(
  user: Express.User,
  bsdasri: FullDbBsdasri,
  input: BsdasriSignatureInput & { signatureAuthor?: SignatureAuthor } & {
    securityCode?: number;
  }
) {
  if (bsdasri.type === BsdasriType.SYNTHESIS) {
    // we keep this code here i.o the state machine to return a customized error message
    throw new UserInputError(
      "Un dasri de synthèse INITIAL attend une signature transporteur, la signature producteur n'est pas acceptée."
    );
  }
  const transporterReceipt = await getTransporterReceipt(bsdasri);
  await validateBsdasri(
    {
      ...(bsdasri as any),
      ...transporterReceipt
    },
    { emissionSignature: true }
  );

  // 'signatureAuthor' can be used in signBsdasriEmissionWithSecretCode to
  // specify that a signature with secret code is made on behalf of the eco-organisme
  let emittedByEcoOrganisme = input.signatureAuthor === "ECO_ORGANISME";

  if (!emittedByEcoOrganisme && bsdasri.ecoOrganismeSiret) {
    const userRoles = await getUserRoles(user.id);
    if (
      userRoles[bsdasri.ecoOrganismeSiret] &&
      can(userRoles[bsdasri.ecoOrganismeSiret], Permission.BsdCanSignEmission)
    ) {
      emittedByEcoOrganisme = true;
    }
  }

  const updateInput: Prisma.BsdasriUpdateInput = {
    emitterEmissionSignatureAuthor: input.author,
    emitterEmissionSignatureDate: new Date(input.date ?? Date.now()),
    emissionSignatory: { connect: { id: user.id } },
    emittedByEcoOrganisme,
    isEmissionTakenOverWithSecretCode: !!input.securityCode
  };

  // compute next status with a state machine
  const status = await getNextStatus(bsdasri, {
    type: input.type,
    dasriUpdateInput: updateInput as any
  });

  return updateBsdasri(user, bsdasri, {
    ...updateInput,
    status,
    ...transporterReceipt
  });
}

/**
 * Sign the transport of the BSDASRI
 * @param user the user who is performing the signature
 * @param bsdasri the BSDASRI under signature
 * @param input the signature info
 * @returns the signed BSDASRI
 */
async function signTransport(
  user: Express.User,
  bsdasri: FullDbBsdasri,
  input: BsdasriSignatureInput
) {
  // handle synthesis special cases
  if (bsdasri.type === BsdasriType.SYNTHESIS) {
    if (!bsdasri.synthesizing?.length) {
      throw new UserInputError(
        "Un dasri de synthèse doit avoir des bordereaux associés"
      );
    }
  }

  // direct emport is always allowed for synthesis BSDASRI as they are created
  // by the tranporter
  let isEmissionDirectTakenOver = bsdasri.type == BsdasriType.SYNTHESIS;

  if (!isEmissionDirectTakenOver && !bsdasri.emitterEmissionSignatureDate) {
    // there is no emitter signature yet
    // raise error if "emport direct" is not allowed
    if (bsdasri.type == BsdasriType.GROUPING) {
      throw new UserInputError(
        "L'emport direct est interdit pour les bordereaux dasri de groupement"
      );
    }

    const emitterCompany = await getCompanyOrCompanyNotFound({
      siret: bsdasri.emitterCompanySiret!
    });
    if (!emitterCompany.allowBsdasriTakeOverWithoutSignature) {
      throw new UserInputError(
        "Erreur, l'émetteur n'a pas autorisé l'emport par le transporteur sans l'avoir préalablement signé"
      );
    }
    isEmissionDirectTakenOver = true;
  }

  await validateBsdasri(bsdasri as any, {
    emissionSignature: true,
    transportSignature: true
  });

  const updateInput: Prisma.BsdasriUpdateInput = {
    transporterTransportSignatureAuthor: input.author,
    transporterTransportSignatureDate: new Date(input.date ?? Date.now()),
    transportSignatory: { connect: { id: user.id } },
    isEmissionDirectTakenOver
  };

  const status = await getNextStatus(bsdasri, {
    type: input.type,
    dasriUpdateInput: updateInput as any
  });

  return updateBsdasri(user, bsdasri, { ...updateInput, status });
}

/**
 * Sign the reception of the BSDASRI
 * @param user the user who is performing the signature
 * @param bsdasri the BSDASRI under signature
 * @param input the signature info
 * @returns the signed BSDASRI
 */
async function signReception(
  user: Express.User,
  bsdasri: FullDbBsdasri,
  input: BsdasriSignatureInput
) {
  await validateBsdasri(bsdasri as any, { receptionSignature: true });

  const updateInput: Prisma.BsdasriUpdateInput = {
    destinationReceptionSignatureAuthor: input.author,
    destinationReceptionSignatureDate: new Date(input.date ?? Date.now()),
    receptionSignatory: { connect: { id: user.id } },
    ...(!bsdasri.handedOverToRecipientAt
      ? {
          handedOverToRecipientAt: bsdasri.destinationReceptionDate
        }
      : {})
  };

  const status = await getNextStatus(bsdasri, {
    type: input.type,
    dasriUpdateInput: updateInput as any
  });

  return updateBsdasri(user, bsdasri, { ...updateInput, status });
}

/**
 * Sign the operation of the BSDASRI
 * @param user the user who is performing the signature
 * @param bsdasri the BSDASRI under signature
 * @param input the signature info
 * @returns the signed BSDASRI
 */
async function signOperation(
  user: Express.User,
  bsdasri: FullDbBsdasri,
  input: BsdasriSignatureInput
) {
  await validateBsdasri(bsdasri as any, { operationSignature: true });

  const updateInput: Prisma.BsdasriUpdateInput = {
    destinationOperationSignatureAuthor: input.author,
    destinationOperationSignatureDate: new Date(input.date ?? Date.now()),
    operationSignatory: { connect: { id: user.id } }
  };

  const status = await getNextStatus(bsdasri, {
    type: input.type,
    dasriUpdateInput: updateInput as any
  });

  return updateBsdasri(user, bsdasri, { ...updateInput, status });
}

/**
 * Perform the signature in DB and run the
 * post signature hook in transaction
 */
async function updateBsdasri(
  user: Express.User,
  bsdasri: Bsdasri,
  updateInput: Prisma.BsdasriUpdateInput
) {
  return runInTransaction(async transaction => {
    const bsdasriRepository = getBsdasriRepository(user, transaction);
    const signedBsdasri = await bsdasriRepository.update(
      { id: bsdasri.id },
      updateInput
    );
    await postSignatureHook(signedBsdasri, bsdasriRepository);
    return signedBsdasri;
  });
}

/**
 * Custom signature hook used to update dependent objects
 * based on the new status of the signed BSDASRI
 */
async function postSignatureHook(
  bsdasri: Bsdasri,
  repository: BsdasriRepository
) {
  if (bsdasri.type === BsdasriType.SYNTHESIS) {
    // cascade on synthesized
    if (bsdasri.status === BsdasriStatus.RECEIVED) {
      const {
        destinationCompanyName,
        destinationCompanySiret,
        destinationCompanyAddress,
        destinationCompanyContact,
        destinationCompanyPhone,
        destinationCompanyMail,
        destinationReceptionDate,
        receptionSignatoryId,
        destinationReceptionSignatureAuthor,
        destinationReceptionSignatureDate
      } = bsdasri;
      await repository.updateMany(
        { synthesizedInId: bsdasri.id },
        {
          status: BsdasriStatus.RECEIVED,
          destinationCompanyName,
          destinationCompanySiret,
          destinationCompanyAddress,
          destinationCompanyContact,
          destinationCompanyPhone,
          destinationCompanyMail,
          destinationReceptionDate,
          receptionSignatoryId,
          destinationReceptionSignatureAuthor,
          destinationReceptionSignatureDate,
          destinationReceptionAcceptationStatus: WasteAcceptationStatus.ACCEPTED
        }
      );
    }

    if (bsdasri.status === BsdasriStatus.PROCESSED) {
      const {
        destinationOperationCode,
        destinationOperationDate,
        operationSignatoryId,
        destinationOperationSignatureDate,
        destinationOperationSignatureAuthor
      } = bsdasri;

      await repository.updateMany(
        { synthesizedInId: bsdasri.id },
        {
          status: BsdasriStatus.PROCESSED,
          destinationOperationCode,
          destinationOperationDate,
          operationSignatoryId,
          destinationOperationSignatureDate,
          destinationOperationSignatureAuthor
        }
      );
    }
  }

  if (bsdasri.type === BsdasriType.GROUPING) {
    if (bsdasri.status === BsdasriStatus.PROCESSED) {
      await repository.updateMany(
        { groupedInId: bsdasri.id },
        { status: BsdasriStatus.PROCESSED }
      );
    }
    if (bsdasri.status === BsdasriStatus.REFUSED) {
      await repository.updateMany(
        { groupedInId: bsdasri.id },
        { groupedInId: null }
      );
    }
  }
}
