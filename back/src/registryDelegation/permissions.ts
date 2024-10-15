import { Company, RegistryDelegation, User } from "@prisma/client";
import { prisma } from "@td/prisma";
import { ForbiddenError } from "../common/errors";
import { can, Permission } from "../permissions";

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

  if (
    !can(companyAssociation.role, Permission.CompanyCanManageRegistryDelegation)
  ) {
    throw new ForbiddenError(
      "Vous n'avez pas les permissions suffisantes pour pouvoir créer une délégation."
    );
  }
}

export async function checkCanAccess(
  user: User,
  delegation: RegistryDelegation
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
  delegation: RegistryDelegation
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
    !companyAssociations.some(association =>
      can(association.role, Permission.CompanyCanManageRegistryDelegation)
    )
  ) {
    throw new ForbiddenError(
      "Vous n'avez pas les permissions suffisantes pour pouvoir créer une délégation."
    );
  }
}

export async function checkBelongsTo(user: User, company: Company) {
  const companyAssociation = await prisma.companyAssociation.findFirst({
    where: {
      userId: user.id,
      companyId: company.id
    }
  });

  if (!companyAssociation) {
    throw new ForbiddenError(
      `L'utilisateur ne fait pas partie de l'entreprise ${company.orgId}.`
    );
  }
}
