import { StateSummaryResolvers } from "../../generated/graphql/types";

const stateSummaryResolvers: StateSummaryResolvers = {
  packagings: parent => parent.packagings || []
};

export default stateSummaryResolvers;
