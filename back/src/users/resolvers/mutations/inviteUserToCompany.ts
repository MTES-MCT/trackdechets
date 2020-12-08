import { User } from "@prisma/client";
import prisma from "src/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { sendMail } from "../../../mailer/mailing";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  convertUrls,
  getCompanyOrCompanyNotFound
} from "../../../companies/database";
import {
  CompanyPrivate,
  MutationInviteUserToCompanyArgs,
  MutationResolvers
} from "../../../generated/graphql/types";
import { sanitizeEmail } from "../../../utils";
import { associateUserToCompany, createUserAccountHash } from "../../database";
import { userMails } from "../../mails";
import { checkIsCompanyAdmin } from "../../permissions";

export async function inviteUserToCompanyFn(
  adminUser: User,
  { email: unsafeEmail, siret, role }: MutationInviteUserToCompanyArgs
): Promise<CompanyPrivate> {
  const email = sanitizeEmail(unsafeEmail);

  const existingUser = await prisma.user.findUnique({ where: { email } });

  const company = await prisma.company.findUnique({ where: { siret } });

  if (existingUser) {
    // there is already an user with this email
    // associate the user with the company

    await associateUserToCompany(existingUser.id, siret, role);

    await sendMail(
      userMails.notifyUserOfInvite(
        email,
        existingUser.name,
        adminUser.name,
        company.name
      )
    );
  } else {
    // No user matches this email. Create a temporary association
    // and send a link inviting him to create an account. As soon
    // as the account is created, the association will be persisted

    const userAccountHash = await createUserAccountHash(email, role, siret);

    await sendMail(
      userMails.inviteUserToJoin(
        email,
        adminUser.name,
        company.name,
        userAccountHash.hash
      )
    );
  }

  return convertUrls(company);
}

const inviteUserToCompanyResolver: MutationResolvers["inviteUserToCompany"] = async (
  parent,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const company = await getCompanyOrCompanyNotFound({ siret: args.siret });
  await checkIsCompanyAdmin(user, company);
  return inviteUserToCompanyFn(user, args);
};

export default inviteUserToCompanyResolver;
