import { MutationResolvers } from "@trackdechets/codegen/src/back.gen";
import { prepareSegment } from "./multiModal";

const prepareSegmentResolver: MutationResolvers["prepareSegment"] = (
  parent,
  args,
  context
) => {
  return prepareSegment(args, context);
};

export default prepareSegmentResolver;
