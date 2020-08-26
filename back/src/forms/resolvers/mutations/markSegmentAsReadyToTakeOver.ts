import { markSegmentAsReadyToTakeOver } from "./multiModal";
import { MutationResolvers } from "../../../generated/graphql/types";

const markSegmentAsReadyToTakeOverResolver: MutationResolvers["markSegmentAsReadyToTakeOver"] = (
  parent,
  args,
  context
) => {
  return markSegmentAsReadyToTakeOver(args, context);
};

export default markSegmentAsReadyToTakeOverResolver;
