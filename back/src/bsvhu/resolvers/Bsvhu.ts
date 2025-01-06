import type { BsvhuResolvers } from "@td/codegen-back";
import { getReadonlyBsvhuRepository } from "../repository";

const bsvhuResolvers: BsvhuResolvers = {
  intermediaries: async bsvhu => {
    const intermediaries = await getReadonlyBsvhuRepository()
      .findRelatedEntity({ id: bsvhu.id })
      .intermediaries();

    return intermediaries ?? null;
  },
  metadata: bsvhu => {
    return {
      id: bsvhu.id
    } as any;
  }
};

export default bsvhuResolvers;
