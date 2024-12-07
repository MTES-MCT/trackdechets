import { markSegmentAsReadyToTakeOver } from "./multiModal";
import type { MutationResolvers } from "@td/codegen-back";

const markSegmentAsReadyToTakeOverResolver: MutationResolvers["markSegmentAsReadyToTakeOver"] =
  (parent, args, context) => {
    return markSegmentAsReadyToTakeOver(args, context);
  };

export default markSegmentAsReadyToTakeOverResolver;
