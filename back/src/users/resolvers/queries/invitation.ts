import { QueryResolvers } from "../../../generated/graphql/types";
import { prisma } from "../../../generated/prisma-client";
import {
  associateUserToCompany,
  getUserAccountHashOrNotFound
} from "../../database";

/**
 * This query is used to check if the invitation hash is valid
 * or if the user has already joined when clicking the invitation
 * link sent by email
 */
const invitationResolver: QueryResolvers["invitation"] = async (
  parent,
  { hash }
) => {
  const invitation = await getUserAccountHashOrNotFound({ hash });

  // Compatibility code used to handle stale invitations
  // as a result of not taking into account the possibility
  // of a user being invited to several companies before it joins
  const user = await prisma.user({ email: invitation.email });
  if (user && !invitation.acceptedAt) {
    // user has already joined with another link
    // but this invitation was not consumed.
    const joined = await prisma.$exists.companyAssociation({
      user: { email: user.email },
      company: { siret: invitation.companySiret }
    });
    if (!joined) {
      // user does not belong to company, create the association
      await associateUserToCompany(
        user.id,
        invitation.companySiret,
        invitation.role
      );
    }
    const updatedInvitation = await prisma.updateUserAccountHash({
      where: { hash },
      data: { acceptedAt: new Date().toISOString() }
    });
    return updatedInvitation;
  }

  return invitation;
};

export default invitationResolver;
