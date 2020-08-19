import { WasteDetailsResolvers } from "../../generated/graphql/types";

const wasteDetailsResolvers: WasteDetailsResolvers = {
  packagings: parent => parent.packagings || []
};

export default wasteDetailsResolvers;
