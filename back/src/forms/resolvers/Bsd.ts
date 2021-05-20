import { BsdResolvers } from "../../generated/graphql/types";
import { ReadableIdPrefix } from "../../forms/readableId";

const bsdResolvers: BsdResolvers = {
  __resolveType: parent => {
    if (parent.id.startsWith(ReadableIdPrefix.DASRI)) {
      return "Bsdasri";
    }
    if (parent.id.startsWith(ReadableIdPrefix.VHU)) {
      return "Bsvhu";
    }
    return "Form";
  }
};

export default bsdResolvers;
