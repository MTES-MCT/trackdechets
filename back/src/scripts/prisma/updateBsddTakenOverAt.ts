import { getFormRepository } from "../../forms/repository";
import prisma from "../../prisma";

type QueryRawReturnType = {
  id: string;
  emittedAt: Date;
  takenOverAt: Date;
}[];

type UpdateBsddTakenOvetAtProps = {
  gt: Date;
  lt: Date;
};

/**
 * BSDD - Set takenOverAt = emittedAt when takenOverAt < emittedAt
 */
export async function updateBsddTakenOverAt({
  gt,
  lt
}: UpdateBsddTakenOvetAtProps) {
  const bsds = await prisma.$queryRaw<QueryRawReturnType>`
    SELECT "id", "emittedAt", "takenOverAt" FROM "default$default"."Form" 
    WHERE "emittedAt" > "takenOverAt"
    AND "isDeleted" = false
    AND "createdAt" > ${gt}
    AND "createdAt" < ${lt};`;
  const user = { id: "support-td", authType: "script" };

  const { update } = getFormRepository(user as any);
  for (const bsd of bsds) {
    await update({ id: bsd.id }, { takenOverAt: bsd.emittedAt });
  }

  return bsds.length;
}
