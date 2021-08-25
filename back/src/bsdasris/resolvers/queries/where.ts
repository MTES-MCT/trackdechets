import { Prisma } from "@prisma/client";
import { UserInputError } from "apollo-server-express";
import { safeInput } from "../../../forms/form-converter";
import { BsdasriWhere, DateFilter } from "../../../generated/graphql/types";

export function buildDbFilter(
  where: BsdasriWhere,
  userSirets: string[]
): Prisma.BsdasriWhereInput {
  const belongToUserSirets = {
    OR: [
      { emitterCompanySiret: { in: userSirets } },
      { transporterCompanySiret: { in: userSirets } },
      { recipientCompanySiret: { in: userSirets } }
    ]
  };

  if (!where) {
    return belongToUserSirets;
  }

  const { _or, _and, _not, ...filters } = where;

  const hasOrNesting = _or?.some(w => w._or || w._and || w._not);
  const hasAndNesting = _and?.some(w => w._or || w._and || w._not);
  const hasNotNesting = _not?.some(w => w._or || w._and || w._not);

  if (hasOrNesting || hasAndNesting || hasNotNesting) {
    throw new UserInputError("Cannot nest conditions deeper than one level");
  }

  const safeWhere = safeInput({
    OR: _or?.map(w => toPrismaFilter(w)),
    AND: _and?.map(w => toPrismaFilter(w)),
    NOT: _not?.map(w => toPrismaFilter(w)),
    ...toPrismaFilter(filters)
  });

  return {
    ...belongToUserSirets,
    ...safeWhere
  };
}

const getGroupableCondition = (groupable?: boolean) => {
  // groupable dasris should:
  // neither regroup not be regrouped
  // neither synthesize not be synthesized
  if (!!groupable) {
    return {
      regroupedBsdasris: { none: {} },
      regroupedOnBsdasri: null,
      synthesizedBsdasris: { none: {} },
      synthesizedOnBsdasri: null
    };
  }
  if (groupable === false) {
    return {
      OR: [
        { regroupedBsdasris: { some: {} } },
        { NOT: { regroupedOnBsdasri: null } },
        { synthesizedBsdasris: { some: {} } },
        { NOT: { synthesizedOnBsdasri: null } }
      ]
    };
  }
  return {};
};

function toPrismaFilter(where: Omit<BsdasriWhere, "_or" | "_and" | "_not">) {
  return safeInput({
    createdAt: where.createdAt
      ? toPrismaDateFilter(where.createdAt)
      : undefined,
    updatedAt: where.updatedAt
      ? toPrismaDateFilter(where.updatedAt)
      : undefined,

    ...(where.id_in ? { id: { in: where.id_in } } : {}),

    emitterCompanySiret: where.emitter?.company?.siret,
    transporterCompanySiret: where.transporter?.company?.siret,
    recipientCompanySiret: where.recipient?.company?.siret,
    ...(!!where.processingOperation
      ? { processingOperation: { in: where.processingOperation } }
      : {}),
    status: where.status,
    isDraft: where.isDraft,
    ...getGroupableCondition(where?.groupable)
  });
}

function toPrismaDateFilter(dateFilter: DateFilter): Prisma.DateTimeFilter {
  return safeInput({
    gt: dateFilter._gt,
    gte: dateFilter._gte,
    lt: dateFilter._lt,
    lte: dateFilter._lte,
    equals: dateFilter._eq
  });
}
