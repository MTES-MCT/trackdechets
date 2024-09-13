import { ZodBsvhuTransformer } from "./types";

export const fillIntermediariesOrgIds: ZodBsvhuTransformer = bsvhu => {
  bsvhu.intermediariesOrgIds = bsvhu.intermediaries
    ? bsvhu.intermediaries
        .flatMap(intermediary => [intermediary.siret, intermediary.vatNumber])
        .filter(Boolean)
    : undefined;

  return bsvhu;
};
