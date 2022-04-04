import { StateSummaryResolvers } from "@trackdechets/codegen/src/back.gen";

const stateSummaryResolvers: StateSummaryResolvers = {
  packagingInfos: parent => parent.packagingInfos || [],
  packagings: parent => parent.packagings || []
};

export default stateSummaryResolvers;
