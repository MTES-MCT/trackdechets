import { MutationResolvers } from "@td/codegen-back";
import { prepareSegment } from "./multiModal";

const prepareSegmentResolver: MutationResolvers["prepareSegment"] = (
  parent,
  args,
  context
) => {
  return prepareSegment(
    {
      id: args.id,
      orgId: args.siret,
      nextSegmentInfo: args.nextSegmentInfo
    },
    context
  );
};

export default prepareSegmentResolver;
