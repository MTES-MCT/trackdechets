import { BsdResolvers } from "../../generated/graphql/types";

const bsdResolvers: BsdResolvers = {
  __resolveType: parent => {
    if (parent.id.startsWith("DASRI")) {
      return "Bsdasri";
    }
    return "Form";
  }
};

export default bsdResolvers;
