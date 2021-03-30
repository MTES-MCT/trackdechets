import { BsvhuResolvers } from "../../generated/graphql/types";

const bsvhuResolvers: BsvhuResolvers = {
  metadata: bsvhu => {
    return {
      id: bsvhu.id
    } as any;
  }
};

export default bsvhuResolvers;
