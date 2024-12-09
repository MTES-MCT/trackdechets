import { prisma } from "@td/prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { QueryResolvers } from "@td/codegen-back";
import { getFormsRightFilter } from "../../database";
import { getConnection } from "../../../common/pagination";
import { getUserRoles } from "../../../permissions";
import { ForbiddenError, UserInputError } from "../../../common/errors";

const PAGINATE_BY = 100;

const formsLifeCycleResolver: QueryResolvers["formsLifeCycle"] = async (
  parent,
  { siret, loggedAfter, loggedBefore, cursorAfter, cursorBefore, formId },
  context
) => {
  const user = checkIsAuthenticated(context);

  const userRoles = await getUserRoles(user.id);
  const userCompaniesSiretOrVat = Object.keys(userRoles);

  // User must be associated with a company
  if (!userCompaniesSiretOrVat.length) {
    throw new ForbiddenError(
      "Vous n'êtes pas autorisé à consulter le cycle de vie des bordereaux."
    );
  }
  // If user is associated with several companies, siret is mandatory
  if (userCompaniesSiretOrVat.length > 1 && !siret) {
    throw new UserInputError(
      "Vous devez préciser pour quel siret vous souhaitez consulter",
      {
        invalidArgs: ["siret"]
      }
    );
  }
  // If requested siret does not belong to user, raise an error
  if (!!siret && !userCompaniesSiretOrVat.includes(siret)) {
    throw new ForbiddenError(
      "Vous n'avez pas le droit d'accéder au siret précisé"
    );
  }
  // Select user company siret matching siret or get the first
  const selectedSiret = siret || userCompaniesSiretOrVat.shift();

  const formsFilter = getFormsRightFilter(selectedSiret!);

  const gqlPaginationArgs = {
    after: cursorAfter,
    before: cursorBefore,
    defaultPaginateBy: PAGINATE_BY
  };

  const where = {
    loggedAt: {
      not: null,
      ...(loggedAfter && { gte: new Date(loggedAfter) }),
      ...(loggedBefore && { lte: new Date(loggedBefore) })
    },
    form: {
      ...formsFilter,
      isDeleted: false,
      id: formId !== null ? formId : undefined
    }
  };

  const totalCount = await prisma.statusLog.count({ where });

  const { pageInfo, edges } = await getConnection({
    totalCount,
    findMany: prismaPaginationArgs =>
      prisma.statusLog.findMany({
        where,
        ...prismaPaginationArgs,
        orderBy: { loggedAt: "desc" },
        include: {
          form: { select: { id: true, readableId: true } },
          user: { select: { id: true, email: true } }
        }
      }),
    formatNode: statusLog => statusLog,
    ...gqlPaginationArgs
  });

  return {
    statusLogs: edges.map(({ node }) => node),
    count: totalCount,
    hasNextPage: pageInfo.hasNextPage,
    hasPreviousPage: pageInfo.hasPreviousPage,
    startCursor: pageInfo.startCursor,
    endCursor: pageInfo.endCursor
  };
};

export default formsLifeCycleResolver;
