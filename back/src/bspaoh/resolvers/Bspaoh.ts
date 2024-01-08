import { BspaohResolvers } from "../../generated/graphql/types";

export const Bspaoh: BspaohResolvers = {
  metadata: bspaoh => {
    return {
      id: bspaoh.id,
      status: bspaoh.status
    } as any;
  }
};
