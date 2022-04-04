import { markSegmentAsReadyToTakeOver } from "./multiModal";
import { MutationResolvers } from "@trackdechets/codegen/src/back.gen";

const markSegmentAsReadyToTakeOverResolver: MutationResolvers["markSegmentAsReadyToTakeOver"] =
  (parent, args, context) => {
    return markSegmentAsReadyToTakeOver(args, context);
  };

export default markSegmentAsReadyToTakeOverResolver;
