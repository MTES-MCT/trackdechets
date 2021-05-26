import { Prisma } from "@prisma/client";
import { UserInputError } from "apollo-server-express";
import { safeInput } from "../forms/form-converter";
import { BsdaWhere } from "../generated/graphql/types";
import { toPrismaDateFilter } from "../vhu/where";

export function convertWhereToDbFilter(
  where: BsdaWhere
): Prisma.BsdaWhereInput {
  if (!where) {
    return {};
  }

  const { _or, _and, _not, ...filters } = where;

  const hasOrNesting = _or?.some(w => w._or || w._and || w._not);
  const hasAndNesting = _and?.some(w => w._or || w._and || w._not);
  const hasNotNesting = _not?.some(w => w._or || w._and || w._not);

  if (hasOrNesting || hasAndNesting || hasNotNesting) {
    throw new UserInputError("Cannot nest conditions deeper than one level");
  }

  return safeInput({
    OR: _or?.map(w => toPrismaFilter(w)),
    AND: _and?.map(w => toPrismaFilter(w)),
    NOT: _not?.map(w => toPrismaFilter(w)),
    ...toPrismaFilter(filters)
  });
}

function toPrismaFilter(where: Omit<BsdaWhere, "_or" | "_and" | "_not">) {
  return safeInput<Prisma.BsdaWhereInput>({
    createdAt: toPrismaDateFilter(where.createdAt),
    updatedAt: toPrismaDateFilter(where.updatedAt),
    transporterCompanySiret: where.transporter?.company?.siret,
    transporterTransportSignatureDate: toPrismaDateFilter(
      where.transporter?.transport?.signature?.date
    ),
    emitterCompanySiret: where.emitter?.company?.siret,
    emitterEmissionSignatureDate: toPrismaDateFilter(
      where.emitter?.emission?.signature?.date
    ),
    destinationCompanySiret: where.destination?.company?.siret,
    destinationOperationSignatureDate: toPrismaDateFilter(
      where.destination?.operation?.signature?.date
    ),
    workerCompanySiret: where.worker?.company?.siret,
    workerWorkSignatureDate: toPrismaDateFilter(
      where.worker?.work?.signature?.date
    ),
    status: where.status,
    isDraft: where.isDraft
  });
}
