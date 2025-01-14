import { takeOverSegment } from "./multiModal";
import type { MutationResolvers } from "@td/codegen-back";

const takeOverSegmentResolver: MutationResolvers["takeOverSegment"] = (
  parent,
  args,
  context
) => {
  return takeOverSegment(args, context);
};

export default takeOverSegmentResolver;
