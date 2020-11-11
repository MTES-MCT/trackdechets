import { WasteDetailsResolvers } from "../../generated/graphql/types";

const wasteDetailsResolvers: WasteDetailsResolvers = {
  packagingInfos: parent => parent.packagingInfos || []
};

export default wasteDetailsResolvers;
