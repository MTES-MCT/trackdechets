import { MutationResolvers } from "../../../generated/graphql/types";
import { prepareSegment } from "./multiModal";

const prepareSegmentResolver: MutationResolvers["prepareSegment"] = (
  parent,
  args,
  context
) => {
  return prepareSegment(args, context);
};

export default prepareSegmentResolver;
