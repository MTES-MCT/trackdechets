import {
  Company,
  RndtsDeclarationDelegation,
  User,
  UserRole
} from "@prisma/client";
import { prisma } from "@td/prisma";
import { ForbiddenError } from "../common/errors";
import { findDelegateAndDelegatorOrThrow } from "./resolvers/utils";

export async function checkCanCreate(user: User, delegator: Company) {
  const companyAssociation = await prisma.companyAssociation.findFirst({
    where: {
      userId: user.id,
      companyId: delegator.id
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
  const { delegate, delegator } = await findDelegateAndDelegatorOrThrow(
    delegation
  );

  const companyAssociation = await prisma.companyAssociation.findMany({
    where: {
      userId: user.id,
      companyId: { in: [delegate.id, delegator.id] }
    }
  });

  if (!companyAssociation?.length) {
    throw new ForbiddenError(
      "Vous devez faire partie de l'entreprise délégante ou délégataire d'une délégation pour y avoir accès."
    );
  }
}
