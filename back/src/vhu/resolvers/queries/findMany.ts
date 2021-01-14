import { MissingSiret } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { getConnectionsArgs } from "../../../forms/pagination";
import { BordereauVhuQueryFindManyArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";
import { checkIsCompanyMember } from "../../../users/permissions";
import { expandVhuFormFromDb } from "../../converter";

export default async function findMany(
  _,
  { siret, ...rest }: BordereauVhuQueryFindManyArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const company = await getRequestCompany(user, siret);
  if (!company) {
    return [];
  }

  const connectionsArgs = getConnectionsArgs({
    ...rest,
    defaultPaginateBy: 50,
    maxPaginateBy: 500
  });

  const queriedForms = await prisma.vhuForm.findMany({
    ...connectionsArgs,
    orderBy: { createdAt: "desc" },
    where: {
      ...(rest.updatedAfter && {
        updatedAt: { gte: new Date(rest.updatedAfter) }
      }),
      ...(rest.isDraft && { isDraft: rest.isDraft }),
      ...(rest.status && { status: rest.status }),
      ...(rest.siretPresentOnForm && {
        OR: [
          { emitterCompanySiret: rest.siretPresentOnForm },
          { recipientCompanySiret: rest.siretPresentOnForm },
          { transporterCompanySiret: rest.siretPresentOnForm }
        ]
      }),
      isDeleted: false
    }
  });

  return queriedForms.map(f => expandVhuFormFromDb(f));
}

async function getRequestCompany(user: Express.User, siret: string) {
  if (siret) {
    await checkIsCompanyMember({ id: user.id }, { siret });
    return getCompanyOrCompanyNotFound({ siret });
  }

  const userCompanies = await getUserCompanies(user.id);
  if (userCompanies.length === 0) {
    // the user is not member of any companies
    return null;
  }

  if (userCompanies.length > 1) {
    // the user is member of 2 companies or more, a siret is required
    throw new MissingSiret();
  }

  // the user is member of only one company, use it as default
  return userCompanies[0];
}
