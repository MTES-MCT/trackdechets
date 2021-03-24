import { MissingSiret } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { QueryBsvhusArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";
import { checkIsCompanyMember } from "../../../users/permissions";
import { expandVhuFormFromDb } from "../../converter";
import { getConnectionsArgs } from "../../pagination";
import { convertWhereToDbFilter } from "../../where";

export default async function bsvhus(
  _,
  { where: whereArgs, siret, ...paginationArgs }: QueryBsvhusArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const company = await getRequestCompany(user, siret);
  if (!company) {
    return {
      totalCount: 0,
      edges: [],
      pageInfo: {
        startCursor: "",
        endCursor: "",
        hasNextPage: false,
        hasPreviousPage: false
      }
    };
  }

  const itemsPerPage = 50;
  const connectionsArgs = await getConnectionsArgs({
    ...paginationArgs,
    defaultPaginateBy: itemsPerPage,
    maxPaginateBy: 500
  });

  const where = {
    ...convertWhereToDbFilter(whereArgs),
    isDeleted: false
  };

  const totalCount = await prisma.bsvhuForm.count({ where });
  const queriedForms = await prisma.bsvhuForm.findMany({
    ...connectionsArgs,
    orderBy: { createdAt: "desc" },
    where
  });

  const forms = queriedForms.map(f => expandVhuFormFromDb(f));
  return {
    totalCount,
    edges: forms.map(f => ({ cursor: f.id, node: f })),
    pageInfo: {
      startCursor: forms[0].id,
      endCursor: forms[forms.length - (forms.length > itemsPerPage ? 2 : 1)].id,
      hasNextPage: paginationArgs.after ? forms.length > itemsPerPage : false,
      hasPreviousPage: paginationArgs.before
        ? forms.length > itemsPerPage
        : false
    }
  };
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
