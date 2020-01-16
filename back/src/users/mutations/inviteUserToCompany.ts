import { prisma, User, UserRole } from "../../generated/prisma-client";
import { sendMail } from "../../common/mails.helper";
import { userMails } from "../mails";
import { associateUserToCompany } from "./associateUserToCompany";
import { createUserAccountHash } from "./createUserAccountHash";

export async function inviteUserToCompany(
  adminUser: User,
  email: string,
  siret: string,
  role: UserRole
) {
  const existingUser = await prisma.user({ email }).catch(_ => null);

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
