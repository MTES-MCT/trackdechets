import { prisma } from "@td/prisma";
import type { QueryResolvers } from "@td/codegen-back";

const ecoOrganismeResolver: QueryResolvers["ecoOrganismes"] = async (
  _,
  args
) => {
  const { handleBsdd, handleBsda, handleBsdasri, handleBsvhu } = args;

  return prisma.ecoOrganisme.findMany({
    where: {
      handleBsdd: handleBsdd ?? undefined,
      handleBsda: handleBsda ?? undefined,
      handleBsdasri: handleBsdasri ?? undefined,
      handleBsvhu: handleBsvhu ?? undefined
    }
  });
};

export default ecoOrganismeResolver;
