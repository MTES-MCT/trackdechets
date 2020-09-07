import { FormResolvers } from "../../../generated/graphql/types";
import { expandTransportSegmentFromDb } from "../../form-converter";
import { prisma } from "../../../generated/prisma-client";

const transportSegmentResolver: FormResolvers["transportSegments"] = form => {
  return prisma
    .form({ id: form.id })
    .transportSegments({ orderBy: "segmentNumber_ASC" })
    .then(segments =>
      segments.map(el => ({
        ...el,
        ...expandTransportSegmentFromDb(el)
      }))
    );
};

export default transportSegmentResolver;
