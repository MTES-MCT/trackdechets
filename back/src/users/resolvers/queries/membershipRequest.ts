import { ForbiddenError, UserInputError } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyAdminUsers } from "../../../companies/database";
import { QueryResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { getMembershipRequestOrNotFoundError } from "../../database";

const invitationRequestResolver: QueryResolvers["membershipRequest"] = async (
  _,
  { id, siret },
  context
) => {
  const user = checkIsAuthenticated(context);

  if (id && siret) {
    throw new UserInputError(
      "Vous devez faire une recherche par `id` ou `siret` mais pas les deux"
    );
  }

  if (!id && !siret) {
    throw new UserInputError(
      "Vous devez saisir soit `id` soit `siret` comme paramètre de recherche"
    );
  }

  const invitationRequest = await getInvitationRequest({ id, siret }, user);
  if (!invitationRequest) {
    throw new UserInputError("Demande de rattachement non trouvée");
  }

  const membershipRequestUser = await prisma.membershipRequest
    .findUnique({ where: { id: invitationRequest.id } })
    .user();

  const company = await prisma.membershipRequest
    .findUnique({ where: { id: invitationRequest.id } })
    .company();

  if (!membershipRequestUser || !company) {
    throw new Error(
      `Cannot fond company or user for membershipRequest ${invitationRequest.id}`
    );
  }

  // check user is requester or company admin
  const isRequester = user.email === membershipRequestUser.email;

  if (!isRequester) {
    const admins = await getCompanyAdminUsers(company.orgId);
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
    email: membershipRequestUser.email,
    siret: company.orgId,
    name: company.name ?? ""
  };
};

export default invitationRequestResolver;

async function getInvitationRequest(
  { id, siret }: { id?: string | null; siret?: string | null },
  user: Express.User
) {
  if (id) {
    return getMembershipRequestOrNotFoundError({ id });
  }

  if (siret) {
    // search a matching invitation for authenticated user and siret
    const requests = await prisma.membershipRequest.findMany({
      where: { user: { id: user.id }, company: { siret } }
    });
    if (requests.length === 0) {
      return;
    }

    return requests[0];
  }
}
