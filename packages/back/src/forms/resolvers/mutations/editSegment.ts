import { editSegment } from "./multiModal";
import { MutationResolvers } from "@trackdechets/codegen/src/back.gen";

const editSegmentResolver: MutationResolvers["editSegment"] = (
  parent,
  args,
  context
) => {
  return editSegment(args, context);
};

export default editSegmentResolver;
