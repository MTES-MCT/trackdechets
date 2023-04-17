import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import prisma from "../../../prisma";
import { getConnection } from "../../../common/pagination";
import { Prisma } from "@prisma/client";
import { QueryResolvers } from "../../../generated/graphql/types";
import { Permission, checkUserPermissions } from "../../../permissions";

const MIN_SIZE = 0;
const MAX_SIZE = 50;

const formRevisionRequestResolver: QueryResolvers["formRevisionRequests"] =
  async (_, args, context) => {
    const { siret, where = {}, first = MAX_SIZE, after } = args;

    const user = checkIsAuthenticated(context);

    await checkUserPermissions(
      user,
      siret,
      Permission.BsdCanList,
      `Vous n'avez pas la permission de lister les demandes de révision de l'établissement ${siret}`
    );
    // TODO support orgId instead of siret for foreign companies
    const company = await getCompanyOrCompanyNotFound({ siret });

    const pageSize = Math.max(Math.min(first ?? 0, MAX_SIZE), MIN_SIZE);

    const prismaWhere: Prisma.BsddRevisionRequestWhereInput = {
      OR: [
        { authoringCompanyId: company.id },
        { approvals: { some: { approverSiret: company.orgId } } }
      ],
      ...(where.status ? { status: where.status } : {}),
      ...(where.bsddId ? { bsddId: where.bsddId } : {})
    };

    const revisionRequestsTotalCount = await prisma.bsddRevisionRequest.count({
      where: prismaWhere
    });

    return getConnection({
      totalCount: revisionRequestsTotalCount,
      findMany: prismaPaginationArgs =>
        prisma.bsddRevisionRequest.findMany({
          where: prismaWhere,
          ...prismaPaginationArgs,
          orderBy: { createdAt: "desc" }
        }),
      formatNode: node => ({
        ...node,
        // the following fields will be resolved in FormRevisionRequest resolver
        approvals: [],
        content: null,
        authoringCompany: null,
        form: null
      }),
      ...{ after, first: pageSize }
    });
  };

export default formRevisionRequestResolver;
