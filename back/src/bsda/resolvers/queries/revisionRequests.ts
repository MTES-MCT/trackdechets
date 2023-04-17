import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { QueryResolvers } from "../../../generated/graphql/types";
import { getReadonlyBsdaRepository } from "../../repository";
import { getConnection } from "../../../common/pagination";
import { Prisma } from "@prisma/client";
import { Permission, checkUserPermissions } from "../../../permissions";

const MIN_SIZE = 0;
const MAX_SIZE = 50;

export const bsdaRevisionRequests: QueryResolvers["bsdaRevisionRequests"] =
  async (_, args, context) => {
    const { siret, after, first = MAX_SIZE, where: where = {} } = args;
    const user = checkIsAuthenticated(context);
    await checkUserPermissions(
      user,
      siret,
      Permission.BsdCanList,
      `Vous n'avez pas la permission de lister les demandes de révision de l'établissement ${siret}`
    );
    const company = await getCompanyOrCompanyNotFound({ orgId: siret });

    const pageSize = Math.max(Math.min(first ?? 0, MAX_SIZE), MIN_SIZE);

    const prismaWhere: Prisma.BsdaRevisionRequestWhereInput = {
      OR: [
        { authoringCompanyId: company.id },
        { approvals: { some: { approverSiret: company.orgId } } }
      ],
      ...(where.status ? { status: where.status } : {}),
      ...(where.bsdaId ? { bsdaId: where.bsdaId } : {})
    };

    const bsdaRepository = getReadonlyBsdaRepository();
    const revisionRequestsTotalCount =
      await bsdaRepository.countRevisionRequests(prismaWhere);

    return getConnection({
      totalCount: revisionRequestsTotalCount,
      findMany: prismaPaginationArgs =>
        bsdaRepository.findManyBsdaRevisionRequest(prismaWhere, {
          ...prismaPaginationArgs,

          orderBy: { createdAt: "desc" }
        }),
      formatNode: node => ({
        ...node,
        // the following fields will be resolved in BsdaRevisionRequest resolver
        approvals: [],
        content: null,
        authoringCompany: null,
        bsda: null
      }),
      ...{ after, first: pageSize }
    });
  };
