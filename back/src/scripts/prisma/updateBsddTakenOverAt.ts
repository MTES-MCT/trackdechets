import { getFormRepository } from "../../forms/repository";
import { prisma } from "@td/prisma";

type QueryRawReturnType = {
  id: string;
  emittedAt: Date;
  takenOverAt: Date;
}[];

type UpdateBsddTakenOvetAtProps = {
  gte: Date;
  lte: Date;
};

/**
 * BSDD - Set takenOverAt = emittedAt when takenOverAt < emittedAt
 */
export async function updateBsddTakenOverAt({
  gte,
  lte
}: UpdateBsddTakenOvetAtProps) {
  const bsds = await prisma.$queryRaw<QueryRawReturnType>`
    SELECT "id", "emittedAt", "takenOverAt" FROM "default$default"."Form" 
    WHERE "emittedAt" > "takenOverAt"
    AND "isDeleted" = false
    AND "emittedAt" >= ${gte}
    AND "emittedAt" <= ${lte};`;
  const user = { id: "support-td", authType: "script" };

  const { update } = getFormRepository(user as any);
  for (const bsd of bsds) {
    await update({ id: bsd.id }, { takenOverAt: bsd.emittedAt });
  }

  return bsds.length;
}
