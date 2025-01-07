import { prisma } from "@td/prisma";
import type { QueryResolvers } from "@td/codegen-back";
import { UserInputError } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { z } from "zod";
import { siretSchema } from "../../../common/validation/zod/schema";
import {
  getConnection,
  getPrismaPaginationArgs
} from "../../../common/pagination";
import { getMembershipRequestRepository } from "../../repository";
import { isDefined } from "../../../common/helpers";
import { MembershipRequestStatus, User } from "@prisma/client";

export const argsSchema = z.object({
  where: z.object({
    siret: siretSchema().nullish(),
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
  // User must be authenticated
  const user = checkIsAuthenticated(context);

  // Sync validation of args
  const parsedArgs = argsSchema.parse(args);

  // Check on `id` and `siret`. Exactly one of them can be set.
  const { siret, id } = parsedArgs.where;

  if (id && siret) {
    throw new UserInputError(
      "Vous devez faire une recherche par `id` ou `siret` mais pas les deux"
    );
  }

  if (!id && !siret) {
    throw new UserInputError(
      "Vous devez saisir soit `id` soit `siret` comme paramètre de recherche"
    );
  }

  // Make sure company exists
  const findUniqueWhere = isDefined(id) ? { id: id! } : { siret: siret! };
  const company = await prisma.company.findUnique({
    where: findUniqueWhere
  });

  if (!company) {
    throw new UserInputError("L'entreprise ciblée n'existe pas");
  }

  // Make sure user is admin of said company
  const association = await prisma.companyAssociation.findFirst({
    where: {
      userId: user.id,
      companyId: company.id,
      role: "ADMIN"
    }
  });

  if (!association) {
    throw new UserInputError(
      "Vous n'êtes pas administrateur de l'entreprise ciblée"
    );
  }

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
