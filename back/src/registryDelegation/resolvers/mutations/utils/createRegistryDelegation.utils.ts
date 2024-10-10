import { Company, RegistryDelegation } from "@prisma/client";
import { UserInputError } from "../../../../common/errors";
import { getRegistryDelegationRepository } from "../../../repository";
import { ParsedCreateRegistryDelegationInput } from "../../../validation";
import { prisma } from "@td/prisma";
import { renderMail, registryDelegationCreation } from "@td/mail";
import { sendMail } from "../../../../mailer/mailing";
import { toddMMYYYY } from "../../../../utils";

export const createDelegation = async (
  user: Express.User,
  input: ParsedCreateRegistryDelegationInput,
  delegator: Company,
  delegate: Company
) => {
  const delegationRepository = getRegistryDelegationRepository(user);
  return delegationRepository.create({
    startDate: input.startDate,
    endDate: input.endDate,
    comment: input.comment,
    delegate: {
      connect: {
        id: delegate.id
      }
    },
    delegator: {
      connect: {
        id: delegator.id
      }
    }
  });
};

/**
 * Check to prevent having multiple active delegations at the same time.
 *
 * We don't authorize already having a non-revoked delegation (isRevoked=false) that has
 * not yet expired.
 *
 * That means that if the company has a delegation that only takes effect in the future,
 * it cannot create a new one for the meantime. Users would have to delete the delegation
 * in the future and create a new one.
 */
export const checkNoExistingNotRevokedAndNotExpiredDelegation = async (
  user: Express.User,
  delegator: Company,
  delegate: Company
) => {
  const NOW = new Date();

  const delegationRepository = getRegistryDelegationRepository(user);
  const activeDelegation = await delegationRepository.findFirst({
    delegatorId: delegator.id,
    delegateId: delegate.id,
    isRevoked: false,
    OR: [{ endDate: null }, { endDate: { gt: NOW } }]
  });

  if (activeDelegation) {
    throw new UserInputError(
      `Une délégation existe déjà pour ce délégataire et ce délégant (id ${activeDelegation.id})`
    );
  }
};

/**
 * Send a creation email to admin of both companies (delegate & delegator)
 */
export const sendRegistryDelegationCreationEmail = async (
  delegation: RegistryDelegation,
  delegator: Company,
  delegate: Company
) => {
  // Find admins from both delegator & delegate companies
  const companyAssociations = await prisma.companyAssociation.findMany({
    where: {
      companyId: { in: [delegator.id, delegate.id] },
      role: "ADMIN"
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  });

  // Prepare mail template
  const payload = renderMail(registryDelegationCreation, {
    variables: {
      startDate: toddMMYYYY(delegation.startDate),
      delegator,
      delegate
    },
    messageVersions: [
      {
        to: companyAssociations.map(companyAssociation => ({
          email: companyAssociation.user.email,
          name: companyAssociation.user.name
        }))
      }
    ]
  });

  await sendMail(payload);
};
