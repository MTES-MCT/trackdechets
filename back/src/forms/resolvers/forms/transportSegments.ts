import { FormResolvers } from "../../../generated/graphql/types";
import { expandTransportSegmentFromDb } from "../../converter";
import { getTransporters } from "../../database";

const transportSegmentResolver: FormResolvers["transportSegments"] = async (
  form,
  _
) => {
  if (form.transportSegments) {
    return form.transportSegments;
  }

  const segments = (await getTransporters({ id: form.id })).filter(
    t => t.number && t.number >= 2
  );
  return segments
    .sort((s1, s2) => s1.number - s2.number)
    .map(segment => expandTransportSegmentFromDb(segment));
};

export default transportSegmentResolver;
