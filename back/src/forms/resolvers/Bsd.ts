import { BsdResolvers } from "../../generated/graphql/types";

const bsdResolvers: BsdResolvers = {
  __resolveType: () => {
    // In the future we will need some logic to return the appropriate type
    // Perhaps based on the readableId? e.g parent.redableId.startsWith("BSDASRI")

    return "Form";
  }
};

export default bsdResolvers;
