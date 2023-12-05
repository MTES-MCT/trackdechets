import prisma from "../../../prisma";

import { sendMail } from "../../../mailer/mailing";

import { CompanyPrivate } from "../../../generated/graphql/types";

import { randomNumber } from "../../../utils";
import { convertUrls, getCompanyActiveUsers } from "../../database";
import { renderMail, securityCodeRenewal } from "@td/mail";
import { isSiret, isVat } from "shared/constants";
import { UserInputError } from "../../../common/errors";

/**
 * This function is used to renew the security code
 * of a company. If the new security code generated is
 * identical to the previous one, we generate a new one
 * @param siret
 */
export async function renewSecurityCodeFn(
  orgId: string
): Promise<CompanyPrivate> {
  if (!isSiret(orgId) && !isVat(orgId)) {
    throw new UserInputError("Le siret doit faire 14 caractères", {
      invalidArgs: ["siret"]
    });
  }

  const company = await prisma.company.findUnique({ where: { orgId } });

  if (!company) {
    throw new UserInputError(
      "Aucune entreprise enregistré sur Trackdéchets avec ce siret",
      {
        invalidArgs: ["siret"]
      }
    );
  }

  const currentSecurityCode = company.securityCode;

  let newSecurityCode = currentSecurityCode;
  while (newSecurityCode === currentSecurityCode) {
    newSecurityCode = randomNumber(4);
  }

  const updatedCompany = await prisma.company.update({
    where: { orgId },
    data: {
      securityCode: newSecurityCode
    }
  });

  const users = await getCompanyActiveUsers(orgId);
  const recipients = users.map(({ email, name }) => ({
    email,
    name: name ?? ""
  }));

  const mail = renderMail(securityCodeRenewal, {
    to: recipients,
    variables: {
      company: { orgId: company.orgId, name: company.name }
    }
  });
  sendMail(mail);

  return convertUrls(updatedCompany);
}
