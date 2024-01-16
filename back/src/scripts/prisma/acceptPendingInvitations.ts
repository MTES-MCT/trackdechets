import { prisma } from "@td/prisma";
import { associateUserToCompany } from "../../users/database";

/**
 * Accept all pending invitations for users who have already joined by invitation link
 */
export default async function acceptPendingInvitations() {
  const invitations = await prisma.userAccountHash.findMany();
  for (const invitation of invitations) {
    const user = await prisma.user.findUnique({
      where: { email: invitation.email }
    });
    if (user) {
      // this user has already created an account
      const isCompanyMember = await prisma.companyAssociation.findFirst({
        where: {
          user: { email: user.email },
          company: { siret: invitation.companySiret }
        }
      });
      if (isCompanyMember) {
        // the user has already joined this company in the past
        // delete the invitation
        await prisma.userAccountHash.delete({ where: { id: invitation.id } });
      } else {
        // user does not belong to company, create the association
        await associateUserToCompany(
          user.id,
          invitation.companySiret,
          invitation.role
        );
        await prisma.userAccountHash.update({
          where: { hash: invitation.hash },
          data: { acceptedAt: new Date() }
        });
      }
    }
  }
}
