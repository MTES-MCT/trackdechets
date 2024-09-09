import { Company, User, UserRole } from "@prisma/client";
import { prisma } from "@td/prisma";
import { ForbiddenError } from "../common/errors";

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
