import { prisma } from "@td/prisma";
import type { QueryResolvers } from "@td/codegen-back";
import { UserInputError } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { z } from "zod";
import {
  getConnection,
  getPrismaPaginationArgs
} from "../../../common/pagination";
import { getMembershipRequestRepository } from "../../repository";
import { isDefined } from "../../../common/helpers";
import { MembershipRequestStatus, User } from "@prisma/client";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkUserPermissions, Permission } from "../../../permissions";

export const argsSchema = z.object({
  where: z.object({
    orgId: z.string().nullish(),
    id: z.string().nullish()
  }),
  skip: z.number().nonnegative().nullish(),
  first: z.number().min(1).max(50).nullish()
});

const membershipRequestsResolver: QueryResolvers["membershipRequests"] = async (
  _,
  args,
  context
) => {
  // Browser only
  applyAuthStrategies(context, [AuthType.Session]);

  // User must be authenticated
  const user = checkIsAuthenticated(context);

  // Sync validation of args
  const parsedArgs = argsSchema.parse(args);

  // Check on `id` and `orgId`. Exactly one of them can be set.
  const { orgId, id } = parsedArgs.where;

  if (id && orgId) {
    throw new UserInputError(
      "Vous devez faire une recherche par `id` ou `orgId` mais pas les deux"
    );
  }

  if (!id && !orgId) {
    throw new UserInputError(
      "Vous devez saisir soit `id` soit `orgId` comme paramètre de recherche"
    );
  }

  // Make sure company exists
  const findUniqueWhere = isDefined(id) ? { id: id! } : { orgId: orgId! };
  const company = await prisma.company.findUnique({
    where: findUniqueWhere
  });

  if (!company) {
    throw new UserInputError("L'entreprise ciblée n'existe pas");
  }

  // Make sure user has appropriate permissions
  await checkUserPermissions(
    user,
    company.orgId,
    Permission.CompanyCanManageMembers,
    `Vous n'avez pas la permission de lister les demandes de rattachement de l'établissement ${company.orgId}`
  );

  // Fetch membership requests, paginated
  const membershipRequestRepository = getMembershipRequestRepository();

  const { skip, first } = parsedArgs;
  const where = {
    companyId: company.id,
    status: MembershipRequestStatus.PENDING
  };

  const totalCount = await membershipRequestRepository.count(where);

  const paginationArgs = getPrismaPaginationArgs({
    skip: skip ?? 0,
    first: first ?? 50
  });

  const result = await getConnection({
    totalCount,
    findMany: () =>
      membershipRequestRepository.findMany(where, {
        ...paginationArgs,
        orderBy: { updatedAt: "desc" },
        include: { user: true }
      }),
    formatNode: (node: {
      id: string;
      user: User;
      status: MembershipRequestStatus;
      createdAt: Date;
    }) => {
      return {
        id: node.id,
        email: node.user.email,
        name: node.user.name,
        status: node.status,
        createdAt: node.createdAt
      };
    }
  });

  return result;
};

export default membershipRequestsResolver;
