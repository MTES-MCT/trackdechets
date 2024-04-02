import { User } from "@prisma/client";
import { prisma } from "@td/prisma";

import { sendMail } from "../../../mailer/mailing";

import {
  convertUrls,
  getCompanyOrCompanyNotFound
} from "../../../companies/database";
import {
  CompanyPrivate,
  MutationInviteUserToCompanyArgs
} from "../../../generated/graphql/types";
import { sanitizeEmail } from "../../../utils";
import { associateUserToCompany, createUserAccountHash } from "../../database";

import { inviteUserToJoin, notifyUserOfInvite, renderMail } from "@td/mail";

export async function inviteUserToCompanyFn(
  adminUser: User,
  { email: unsafeEmail, siret, role }: MutationInviteUserToCompanyArgs
): Promise<CompanyPrivate> {
  const email = sanitizeEmail(unsafeEmail);

  const existingUser = await prisma.user.findUnique({ where: { email } });

  const company = await getCompanyOrCompanyNotFound({ orgId: siret });

  if (existingUser) {
    // there is already an user with this email
    // associate the user with the company

    await associateUserToCompany(existingUser.id, siret, role, {
      automaticallyAccepted: true
    });

    const mail = renderMail(notifyUserOfInvite, {
      to: [{ email, name: existingUser.name }],
      variables: { companyName: company.name, companyOrgId: siret }
    });
    await sendMail(mail);
  } else {
    // No user matches this email. Create a temporary association
    // and send a link inviting him to create an account. As soon
    // as the account is created, the association will be persisted

    const userAccountHash = await createUserAccountHash(email, role, siret);
    const mail = renderMail(inviteUserToJoin, {
      to: [{ email, name: email }],
      variables: {
        hash: userAccountHash.hash,
        companyName: company.name,
        companyOrgId: siret
      }
    });

    await sendMail(mail);
  }

  return convertUrls(company);
}
