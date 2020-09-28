import { prisma, User } from "../../../generated/prisma-client";
import { sendMail } from "../../../common/mails.helper";
import { userMails } from "../../mails";
import {
  MutationInviteUserToCompanyArgs,
  CompanyPrivate,
  MutationResolvers
} from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkIsCompanyAdmin } from "../../permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { associateUserToCompany, createUserAccountHash } from "../../database";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { sanitizeEmail } from "../../../utils";

export async function inviteUserToCompanyFn(
  adminUser: User,
  { email: unsafeEmail, siret, role }: MutationInviteUserToCompanyArgs
): Promise<CompanyPrivate> {
  const email = sanitizeEmail(unsafeEmail);

  const existingUser = await prisma.user({ email });

  const company = await prisma.company({ siret });

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

  return company;
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
