import { StateSummaryResolvers } from "../../generated/graphql/types";

const stateSummaryResolvers: StateSummaryResolvers = {
  packagingInfos: parent => parent.packagingInfos || [],
  packagings: parent => parent.packagings || []
};

export default stateSummaryResolvers;
