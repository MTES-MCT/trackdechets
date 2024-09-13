import {
  Company,
  RndtsDeclarationDelegation,
  User,
  UserRole
} from "@prisma/client";
import { prisma } from "@td/prisma";
import { ForbiddenError } from "../common/errors";

export async function checkCanCreate(user: User, delegator: Company) {
  const companyAssociation = await prisma.companyAssociation.findFirst({
    where: {
      userId: user.id,
      companyId: delegator.id
    },
    select: {
      role: true
    }
  });

  if (!companyAssociation) {
    throw new ForbiddenError(
      "Vous devez faire partie de l'entreprise délégante pour pouvoir créer une délégation."
    );
  }

  if (companyAssociation.role !== UserRole.ADMIN) {
    throw new ForbiddenError(
      "Vous devez être admin pour pouvoir créer une délégation."
    );
  }
}

export async function checkCanAccess(
  user: User,
  delegation: RndtsDeclarationDelegation
) {
  const companyAssociation = await prisma.companyAssociation.findFirst({
    where: {
      userId: user.id,
      companyId: { in: [delegation.delegateId, delegation.delegatorId] }
    },
    select: {
      id: true
    }
  });

  if (!companyAssociation) {
    throw new ForbiddenError(
      "Vous devez faire partie de l'entreprise délégante ou délégataire d'une délégation pour y avoir accès."
    );
  }
}

export async function checkCanRevoke(
  user: User,
  delegation: RndtsDeclarationDelegation
) {
  const companyAssociations = await prisma.companyAssociation.findMany({
    where: {
      userId: user.id,
      companyId: { in: [delegation.delegatorId, delegation.delegateId] }
    },
    select: {
      role: true
    }
  });

  if (!companyAssociations?.length) {
    throw new ForbiddenError(
      "Vous devez faire partie de l'entreprise délégante ou délégataire d'une délégation pour pouvoir la révoquer."
    );
  }

  if (
    !companyAssociations.some(
      association => association.role === UserRole.ADMIN
    )
  ) {
    throw new ForbiddenError(
      "Vous devez être admin pour pouvoir révoquer une délégation."
    );
  }
}
