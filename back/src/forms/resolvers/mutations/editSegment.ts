import { editSegment } from "./multiModal";
import type { MutationResolvers } from "@td/codegen-back";

const editSegmentResolver: MutationResolvers["editSegment"] = (
  parent,
  args,
  context
) => {
  return editSegment(
    {
      id: args.id,
      orgId: args.siret,
      nextSegmentInfo: args.nextSegmentInfo
    },
    context
  );
};

export default editSegmentResolver;
