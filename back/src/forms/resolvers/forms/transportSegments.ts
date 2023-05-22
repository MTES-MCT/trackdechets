import prisma from "../../../prisma";
import { FormResolvers } from "../../../generated/graphql/types";
import { expandTransportSegmentFromDb } from "../../converter";
import { dashboardOperationName } from "../../../common/queries";
import { isSessionUser } from "../../../auth";
import { BsddTransporter } from "@prisma/client";

const transportSegmentResolver: FormResolvers["transportSegments"] = async (
  form,
  _,
  ctx
) => {
  let segments: BsddTransporter[] = [];

  // use ES indexed field when requested from dashboard
  if (
    ctx?.req?.body?.operationName === dashboardOperationName &&
    isSessionUser(ctx)
  ) {
    segments = (form?.transportSegments as any) ?? [];
  } else {
    segments =
      (await prisma.form
        .findUnique({ where: { id: form.id } })
        .transportSegments({ orderBy: { segmentNumber: "asc" } })) ?? [];
  }

  return segments.map(segment => expandTransportSegmentFromDb(segment));
};

export default transportSegmentResolver;
