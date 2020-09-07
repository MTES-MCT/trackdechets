import { editSegment } from "./multiModal";
import { MutationResolvers } from "../../../generated/graphql/types";

const editSegmentResolver: MutationResolvers["editSegment"] = (
  parent,
  args,
  context
) => {
  return editSegment(args, context);
};

export default editSegmentResolver;
