import prisma from "../../../prisma";
import { FormResolvers } from "../../../generated/graphql/types";
import { expandTransportSegmentFromDb } from "../../converter";
import { dashboardOperationName } from "../../../common/queries";
import { isSessionUser } from "../../../auth";

const transportSegmentResolver: FormResolvers["transportSegments"] = async (
  form,
  _,
  ctx
) => {
  let segments = [];

  // use ES indexed field when requested from dashboard
  if (
    ctx?.req?.body?.operationName === dashboardOperationName &&
    isSessionUser(ctx)
  ) {
    segments = form?.transportSegments ?? [];
  } else {
    segments = await prisma.form
      .findUnique({ where: { id: form.id } })
      .transportSegments({ orderBy: { segmentNumber: "asc" } });
  }

  return segments.map(el => ({
    ...el,
    ...(el.takenOverAt && { takenOverAt: el.takenOverAt }),
    ...expandTransportSegmentFromDb(el)
  }));
};

export default transportSegmentResolver;
