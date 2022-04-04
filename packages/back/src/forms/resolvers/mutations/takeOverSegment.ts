import { takeOverSegment } from "./multiModal";
import { MutationResolvers } from "@trackdechets/codegen/src/back.gen";

const takeOverSegmentResolver: MutationResolvers["takeOverSegment"] = (
  parent,
  args,
  context
) => {
  return takeOverSegment(args, context);
};

export default takeOverSegmentResolver;
