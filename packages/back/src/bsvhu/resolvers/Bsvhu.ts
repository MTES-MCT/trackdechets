import { BsvhuResolvers } from "@trackdechets/codegen/src/back.gen";

const bsvhuResolvers: BsvhuResolvers = {
  metadata: bsvhu => {
    return {
      id: bsvhu.id,
      status: bsvhu.status
    } as any;
  }
};

export default bsvhuResolvers;
