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
      { destinationCompanySiret: { in: userSirets } }
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
  // groupable dasris should not regroup or be regrouped

  if (!!groupable) {
    return {
      grouping: { none: {} },
      groupingIn: null
    };
  }
  if (groupable === false) {
    return {
      OR: [{ grouping: { some: {} } }, { NOT: { groupingIn: null } }]
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
    destinationCompanySiret: where.destination?.company?.siret,
    ...(!!where.destinationOperationCode
      ? { destinationOperationCode: { in: where.destinationOperationCode } }
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
