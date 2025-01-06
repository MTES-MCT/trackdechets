import { prisma } from "@td/prisma";
import { sendMail } from "../../../mailer/mailing";
import type { CompanyPrivate } from "@td/codegen-back";
import { randomNumber } from "../../../utils";
import { renderMail, securityCodeRenewal } from "@td/mail";
import { isSiret, isVat } from "@td/constants";
import { UserInputError } from "../../../common/errors";
import {
  getNotificationSubscribers,
  UserNotification
} from "../../../users/notifications";
import { toGqlCompanyPrivate } from "../../converters";

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

  const subscribers = await getNotificationSubscribers(
    UserNotification.SIGNATURE_CODE_RENEWAL,
    [orgId]
  );

  if (subscribers.length) {
    const mail = renderMail(securityCodeRenewal, {
      to: subscribers,
      variables: {
        company: { orgId: company.orgId, name: company.name }
      }
    });
    await sendMail(mail);
  }

  return toGqlCompanyPrivate(updatedCompany);
}
