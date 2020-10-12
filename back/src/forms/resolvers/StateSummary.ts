import { StateSummaryResolvers } from "../../generated/graphql/types";

const stateSummaryResolvers: StateSummaryResolvers = {
  packagingInfos: parent => parent.packagingInfos || []
};

export default stateSummaryResolvers;
