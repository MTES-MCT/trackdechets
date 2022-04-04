import { WasteDetailsResolvers } from "@trackdechets/codegen/src/back.gen";

const wasteDetailsResolvers: WasteDetailsResolvers = {
  packagingInfos: parent => parent.packagingInfos || []
};

export default wasteDetailsResolvers;
