import prisma from "../../../prisma";
import { FormResolvers } from "../../../generated/graphql/types";
import { expandTransportSegmentFromDb } from "../../form-converter";

const transportSegmentResolver: FormResolvers["transportSegments"] = async form => {
  const segments = await prisma.form
    .findUnique({ where: { id: form.id } })
    .transportSegments({ orderBy: { segmentNumber: "asc" } });
  return segments.map(el => ({
    ...el,
    ...(el.takenOverAt && { takenOverAt: el.takenOverAt }),
    ...expandTransportSegmentFromDb(el)
  }));
};

export default transportSegmentResolver;
