import prisma from "../../../prisma";
import {
  FormResolvers,
  TransportSegment
} from "../../../generated/graphql/types";
import { expandTransportSegmentFromDb } from "../../converter";
import { dashboardOperationName } from "../../../common/queries";
import { isSessionUser } from "../../../auth";

const transportSegmentResolver: FormResolvers["transportSegments"] = async (
  form,
  _,
  ctx
) => {
  let segments: TransportSegment[] = [];

  // use ES indexed field when requested from dashboard
  if (
    ctx?.req?.body?.operationName === dashboardOperationName &&
    isSessionUser(ctx)
  ) {
    segments = form?.transportSegments ?? [];
  } else {
    const dbSegments = await prisma.form
      .findUnique({ where: { id: form.id } })
      .transportSegments({ orderBy: { segmentNumber: "asc" } });
    segments =
      dbSegments?.map(segment => expandTransportSegmentFromDb(segment)) ?? [];
  }

  return segments.map(el => ({
    ...el,
    ...(el.takenOverAt && { takenOverAt: el.takenOverAt })
  }));
};

export default transportSegmentResolver;
