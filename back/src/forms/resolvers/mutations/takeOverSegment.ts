import { takeOverSegment } from "./multiModal";
import { MutationResolvers } from "../../../generated/graphql/types";

const takeOverSegmentResolver: MutationResolvers["takeOverSegment"] = (
  parent,
  args,
  context
) => {
  return takeOverSegment(args, context);
};

export default takeOverSegmentResolver;
