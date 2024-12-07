import { WasteDetailsResolvers } from "@td/codegen-back";

const wasteDetailsResolvers: WasteDetailsResolvers = {
  packagingInfos: parent => parent.packagingInfos || []
};

export default wasteDetailsResolvers;
