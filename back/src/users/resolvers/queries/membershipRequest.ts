import { ForbiddenError, UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyAdminUsers } from "../../../companies/database";
import { QueryResolvers } from "../../../generated/graphql/types";
import { MembershipRequest } from "@prisma/client";
import prisma from "src/prisma";
import { getMembershipRequestOrNotFoundError } from "../../database";

const invitationRequestResolver: QueryResolvers["membershipRequest"] = async (
  parent,
  { id, siret },
  context
) => {
  const user = checkIsAuthenticated(context);

  if (id && siret) {
    throw new UserInputError(
      "Vous devez faire une recherche par `id` ou `siret` mais pas les deux"
    );
  }

  let invitationRequest: MembershipRequest = null;

  if (id) {
    invitationRequest = await getMembershipRequestOrNotFoundError({ id });
  }

  if (siret) {
    // search a matching invitation for authenticated user and siret
    const requests = await prisma.membershipRequest.findMany({
      where: { user: { id: user.id }, company: { siret } }
    });
    if (requests.length === 0) {
      return null;
    } else {
      invitationRequest = requests[0];
    }
  }

  const { email } = await prisma.membershipRequest
    .findUnique({ where: { id: invitationRequest.id } })
    .user();

  const company = await prisma.membershipRequest
    .findUnique({ where: { id: invitationRequest.id } })
    .company();

  // check user is requester or company admin
  const isRequester = user.email === email;

  if (!isRequester) {
    const admins = await getCompanyAdminUsers(company.siret);
    if (!admins.map(u => u.id).includes(user.id)) {
      // user is neither requester nor admin of the company, throw error
      throw new ForbiddenError(
        "Vous n'avez pas le droit de consulter cette demande de rattachement"
      );
    }
  }

  return {
    id: invitationRequest.id,
    sentTo: invitationRequest.sentTo,
    status: invitationRequest.status,
    email,
    siret: company.siret,
    name: company.name
  };
};

export default invitationRequestResolver;
