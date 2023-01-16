import { editSegment } from "./multiModal";
import { MutationResolvers } from "../../../generated/graphql/types";

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
