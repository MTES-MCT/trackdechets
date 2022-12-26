import { User } from "@prisma/client";
import prisma from "../../../prisma";

import { sendMail } from "../../../mailer/mailing";

import { convertUrls } from "../../../companies/database";
import {
  CompanyPrivate,
  MutationInviteUserToCompanyArgs
} from "../../../generated/graphql/types";
import { sanitizeEmail } from "../../../utils";
import { associateUserToCompany, createUserAccountHash } from "../../database";

import {
  inviteUserToJoin,
  notifyUserOfInvite
} from "../../../mailer/templates";
import { renderMail } from "../../../mailer/templates/renderers";

export async function inviteUserToCompanyFn(
  adminUser: User,
  { email: unsafeEmail, orgId, role }: MutationInviteUserToCompanyArgs
): Promise<CompanyPrivate> {
  const email = sanitizeEmail(unsafeEmail);

  const existingUser = await prisma.user.findUnique({ where: { email } });

  const company = await prisma.company.findUnique({ where: { orgId } });

  if (existingUser) {
    // there is already an user with this email
    // associate the user with the company

    await associateUserToCompany(existingUser.id, company, role);

    const mail = renderMail(notifyUserOfInvite, {
      to: [{ email, name: existingUser.name }],
      variables: { companyName: company.name }
    });
    await sendMail(mail);
  } else {
    // No user matches this email. Create a temporary association
    // and send a link inviting him to create an account. As soon
    // as the account is created, the association will be persisted

    const userAccountHash = await createUserAccountHash(email, role, company);

    const mail = renderMail(inviteUserToJoin, {
      to: [{ email, name: email }],
      variables: { hash: userAccountHash.hash, companyName: company.name }
    });
    await sendMail(mail);
  }

  return convertUrls(company);
}
