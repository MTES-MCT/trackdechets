import { prisma } from "../../generated/prisma-client";
import { randomNumber } from "../../utils";
import { DomainError, ErrorCode } from "../../common/errors";

/**
 * This function is used to renew the security code
 * of a company. If the new security code generated is
 * identical to the previous one, we generate a new one
 * @param siret
 */
export default async function renewSecurityCode(siret: string) {
  if (siret.length != 14) {
    throw new DomainError(
      "Le siret doit faire 14 caractères",
      ErrorCode.BAD_USER_INPUT
    );
  }

  const company = await prisma.company({ siret });

  if (!company) {
    throw new DomainError(
      "Aucune entreprise enregistré sur Trackdéchets avec ce siret",
      ErrorCode.NOT_FOUND
    );
  }

  const currentSecurityCode = company.securityCode;

  let newSecurityCode = null;

  while (!newSecurityCode || newSecurityCode == currentSecurityCode) {
    newSecurityCode = randomNumber(4);
  }

  return prisma.updateCompany({
    where: { siret },
    data: {
      securityCode: newSecurityCode
    }
  });
}
