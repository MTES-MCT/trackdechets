import { prisma } from "../../generated/prisma-client";
import { associateUserToCompany } from "../../users/database";

/**
 * Accept all pending invitations for users who have already joined by invitation link
 */
export default async function acceptPendingInvitations() {
  const invitations = await prisma.userAccountHashes();
  for (const invitation of invitations) {
    const user = await prisma.user({ email: invitation.email });
    if (user) {
      // this user has already created an account
      const isCompanyMember = await prisma.$exists.companyAssociation({
        user: { email: user.email },
        company: { siret: invitation.companySiret }
      });
      if (isCompanyMember) {
        // the user has already joined this company in the past
        // delete the invitation
        await prisma.deleteUserAccountHash({ id: invitation.id });
      } else {
        // user does not belong to company, create the association
        await associateUserToCompany(
          user.id,
          invitation.companySiret,
          invitation.role
        );
        await prisma.updateUserAccountHash({
          where: { hash: invitation.hash },
          data: { acceptedAt: new Date().toISOString() }
        });
      }
    }
  }
}
