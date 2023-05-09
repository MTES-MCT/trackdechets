import { MutationResolvers } from "../../../generated/graphql/types";
import { prepareSegment } from "./multiModal";

const prepareSegmentResolver: MutationResolvers["prepareSegment"] = (
  parent,
  args,
  context
) => {
  return prepareSegment(
    {
      id: args.id,
      orgId: args.siret,
      nextSegmentInfo: args.nextSegmentInfo
    },
    context
  );
};

export default prepareSegmentResolver;
