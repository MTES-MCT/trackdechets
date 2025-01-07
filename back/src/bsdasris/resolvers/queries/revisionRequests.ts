import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import type {
  Bsdasri,
  BsdasriRevisionRequestContent,
  FormCompany,
  QueryResolvers
} from "@td/codegen-back";
import { getReadonlyBsdasriRepository } from "../../repository";
import { getConnection } from "../../../common/pagination";
import { Prisma } from "@prisma/client";
import { Permission, checkUserPermissions } from "../../../permissions";
import { toPrismaStringFilter } from "../../../common/where";

const MIN_SIZE = 0;
const MAX_SIZE = 50;

export const bsdasriRevisionRequests: QueryResolvers["bsdasriRevisionRequests"] =
  async (_, args, context) => {
    const { siret, after, first = MAX_SIZE, where } = args;
    const user = checkIsAuthenticated(context);
    await checkUserPermissions(
      user,
      siret,
      Permission.BsdCanList,
      `Vous n'avez pas la permission de lister les demandes de révision de l'établissement ${siret}`
    );
    const company = await getCompanyOrCompanyNotFound(
      { orgId: siret },
      { id: true, orgId: true }
    );

    const pageSize = Math.max(Math.min(first ?? 0, MAX_SIZE), MIN_SIZE);

    const prismaWhere: Prisma.BsdasriRevisionRequestWhereInput = {
      OR: [
        { authoringCompanyId: company.id },
        { approvals: { some: { approverSiret: company.orgId } } }
      ],
      ...(where?.status ? { status: where.status } : {}),
      ...(where?.bsdasriId
        ? { bsdasriId: toPrismaStringFilter(where.bsdasriId) }
        : {})
    };

    const bsdasriRepository = getReadonlyBsdasriRepository();
    const revisionRequestsTotalCount =
      await bsdasriRepository.countRevisionRequests(prismaWhere);

    return getConnection({
      totalCount: revisionRequestsTotalCount,
      findMany: prismaPaginationArgs =>
        bsdasriRepository.findManyBsdasriRevisionRequest(prismaWhere, {
          ...prismaPaginationArgs,

          orderBy: { createdAt: "desc" }
        }),
      formatNode: node => ({
        ...node,
        // the following fields will be resolved in BsdasriRevisionRequest resolver
        approvals: [],
        content: {} as BsdasriRevisionRequestContent,
        authoringCompany: {} as FormCompany,
        bsdasri: {} as Bsdasri
      }),
      ...{ after, first: pageSize }
    });
  };
