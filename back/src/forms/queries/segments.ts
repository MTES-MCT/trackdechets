import { unflattenObjectFromDb } from "../form-converter";
import { GraphQLContext } from "../../types";
import { prisma } from "../../generated/prisma-client";

export const transportSegments = (parent, args, context: GraphQLContext) => {
  return prisma
    .form({ id: parent.id })
    .transportSegments({orderBy: "segmentNumber_ASC"})
    .then((segments) =>
      segments.map((el) => ({
        ...el,
        ...unflattenObjectFromDb(el),
      }))
    );
};
