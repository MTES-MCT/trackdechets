import { BspaohResolvers } from "@td/codegen-back";

export const Bspaoh: BspaohResolvers = {
  metadata: bspaoh => {
    return {
      id: bspaoh.id,
      status: bspaoh.status
    } as any;
  }
};
