import {
  prisma,
  StatusLogConnection,
  Company
} from "../../generated/prisma-client";
import { GraphQLContext } from "../../types";

import { ForbiddenError, UserInputError } from "apollo-server-express";

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

export const formsLifecycle = async (
  _,
  { siret, loggedAfter, loggedBefore, cursorAfter, cursorBefore, formId },
  context: GraphQLContext
) => {
  const userId = context.user.id;

  const userCompanies = await prisma
    .companyAssociations({ where: { user: { id: userId } } })
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

  const formsFilter = {
    OR: [
      { owner: { id: userId } },
      { recipientCompanySiret: selectedCompany.siret },
      { emitterCompanySiret: selectedCompany.siret },
      {
        transporterCompanySiret: selectedCompany.siret,
        status: "SEALED"
      }
    ]
  };
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
