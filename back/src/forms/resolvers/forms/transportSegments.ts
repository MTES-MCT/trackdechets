import { FormResolvers } from "../../../generated/graphql/types";
import { expandTransportSegmentFromDb } from "../../converter";
import { dashboardOperationName } from "../../../common/queries";
import { isSessionUser } from "../../../auth";
import { BsddTransporter } from "@prisma/client";
import { getTransporters } from "../../database";

const transportSegmentResolver: FormResolvers["transportSegments"] = async (
  form,
  _,
  ctx
) => {
  if (form.transportSegments) {
    return form.transportSegments;
  }

  let segments: BsddTransporter[] = [];

  // use ES indexed field when requested from dashboard
  if (
    ctx?.req?.body?.operationName === dashboardOperationName &&
    isSessionUser(ctx)
  ) {
    segments = (form?.transportSegments as any) ?? [];
  } else {
    segments = (await getTransporters({ id: form.id })).filter(
      t => t.number && t.number >= 2
    );
  }

  return segments
    .sort((s1, s2) => s1.number - s2.number)
    .map(segment => expandTransportSegmentFromDb(segment));
};

export default transportSegmentResolver;
