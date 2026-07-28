import { applyAuthStrategies, AuthType } from "../../../../auth/auth";
import { checkIsAdmin } from "../../../../common/permissions";
import { GraphQLContext } from "../../../../types";
import { prisma } from "@td/prisma";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

const mfaResetRequestsAdmin = async (
  _: unknown,
  { skip = 0, first = DEFAULT_PAGE_SIZE }: { skip?: number; first?: number },
  context: GraphQLContext
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  checkIsAdmin(context);

  const take = Math.min(first, MAX_PAGE_SIZE);

  const [totalCount, requests] = await Promise.all([
    prisma.mfaResetRequest.count(),
    prisma.mfaResetRequest.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { user: true }
    })
  ]);

  const edges = requests.map(r => ({
    cursor: r.id,
    node: {
      ...r,
      user: { email: r.user.email, name: r.user.name }
    }
  }));

  return {
    totalCount,
    pageInfo: {
      startCursor: edges[0]?.cursor ?? null,
      endCursor: edges[edges.length - 1]?.cursor ?? null,
      hasNextPage: skip + take < totalCount,
      hasPreviousPage: skip > 0
    },
    edges
  };
};

export default mfaResetRequestsAdmin;
