import type { StateSummaryResolvers } from "@td/codegen-back";

const stateSummaryResolvers: StateSummaryResolvers = {
  packagingInfos: parent => parent.packagingInfos || [],
  packagings: parent => parent.packagings || []
};

export default stateSummaryResolvers;
