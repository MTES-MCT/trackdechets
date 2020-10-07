import { QueryResolvers } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import {
  prisma,
  StatusLogConnection,
  Company
} from "../../../generated/prisma-client";
import { ForbiddenError, UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getRolesFilter } from "./forms";

const PAGINATE_BY = 100;

const companyFragment = `
    fragment CompanyLifeCycleInfo on CompanyAssociation {
      company {
        id
        siret
      }
    }
    `;
// formsLifeCycle fragment
const statusLogFragment = `
      fragment StatusLogPaginated on StatusLogConnection {
        aggregate {
          count
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        edges {
          node {
            id
            loggedAt
            status
            updatedFields
            form {
              id
              readableId
            }
            user {
              id
              email
            }
          }
        }
      }
    `;

const formsLifeCycleResolver: QueryResolvers["formsLifeCycle"] = async (
  parent,
  { siret, loggedAfter, loggedBefore, cursorAfter, cursorBefore, formId },
  context
) => {
  const user = checkIsAuthenticated(context);

  const userCompanies = await prisma
    .companyAssociations({ where: { user: { id: user.id } } })
    .$fragment<{ company: Company }[]>(companyFragment)
    .then(associations => associations.map(a => a.company));

  // User must be associated with a company
  if (!userCompanies.length) {
    throw new ForbiddenError(
      "Vous n'êtes pas autorisé à consulter le cycle de vie des bordereaux."
    );
  }
  // If user is associated with several companies, siret is mandatory
  if (userCompanies.length > 1 && !siret) {
    throw new UserInputError(
      "Vous devez préciser pour quel siret vous souhaitez consulter",
      {
        invalidArgs: ["siret"]
      }
    );
  }
  // If requested siret does not belong to user, raise an error
  if (!!siret && !userCompanies.map(c => c.siret).includes(siret)) {
    throw new ForbiddenError(
      "Vous n'avez pas le droit d'accéder au siret précisé"
    );
  }
  // Select user company matching siret or get the first
  const selectedCompany =
    userCompanies.find(uc => uc.siret === siret) || userCompanies.shift();

  const formsFilter = getRolesFilter(selectedCompany.siret, []);

  const statusLogsCx = await prisma
    .statusLogsConnection({
      orderBy: "loggedAt_DESC",
      first: PAGINATE_BY,
      after: cursorAfter,
      before: cursorBefore,
      where: {
        loggedAt_not: null,
        loggedAt_gte: loggedAfter,
        loggedAt_lte: loggedBefore,
        form: { ...formsFilter, isDeleted: false, id: formId }
      }
    })
    .$fragment<
      StatusLogConnection & {
        aggregate: { count: number };
      }
    >(statusLogFragment);

  return {
    statusLogs: statusLogsCx.edges.map(el => el.node),
    ...statusLogsCx.pageInfo,
    count: statusLogsCx.aggregate.count
  };
};

export default formsLifeCycleResolver;
