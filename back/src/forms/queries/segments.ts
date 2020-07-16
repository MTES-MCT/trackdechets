import { unflattenObjectFromDb } from "../form-converter";
import { prisma } from "../../generated/prisma-client";

export const transportSegments = parent => {
  return prisma
    .form({ id: parent.id })
    .transportSegments({ orderBy: "segmentNumber_ASC" })
    .then(segments =>
      segments.map(el => ({
        ...el,
        ...unflattenObjectFromDb(el)
      }))
    );
};
