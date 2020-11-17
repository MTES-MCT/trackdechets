import prisma from "src/prisma";
import { FormResolvers } from "../../../generated/graphql/types";
import { expandTransportSegmentFromDb } from "../../form-converter";

const transportSegmentResolver: FormResolvers["transportSegments"] = async form => {
  const segments = await prisma.form
    .findOne({ where: { id: form.id } })
    .transportSegments({ orderBy: { segmentNumber: "asc" } });
  return segments.map(el => ({
    // TODO-PRISMA
    //...el,
    ...expandTransportSegmentFromDb(el)
  }));
};

export default transportSegmentResolver;
