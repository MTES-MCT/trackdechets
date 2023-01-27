import { getBsvhuRepository } from "../../bsvhu/repository";
import prisma from "../../prisma";

type QueryRawReturnType = {
  id: string;
  emitterEmissionSignatureDate: Date;
  transporterTransportTakenOverAt: Date;
}[];

type UpdateBsddTakenOvetAtProps = {
  gt: Date;
  lt: Date;
};

/**
 * BSDD - Set takenOverAt = emittedAt when takenOverAt < emittedAt
 */
export async function updateBsvhuTakenOverAt({
  gt,
  lt
}: UpdateBsddTakenOvetAtProps) {
  const bsvhus = await prisma.$queryRaw<QueryRawReturnType>`
    SELECT "id", "emitterEmissionSignatureDate", "transporterTransportTakenOverAt" FROM "default$default"."Bsvhu" 
    WHERE "emitterEmissionSignatureDate" > "transporterTransportTakenOverAt"
    AND "isDeleted" = false
    AND "createdAt" > ${gt}
    AND "createdAt" < ${lt};`;
  const user = { id: "support-td", authType: "script" };

  const { update } = getBsvhuRepository(user as any);
  for (const bsvhu of bsvhus) {
    await update(
      { id: bsvhu.id },
      { transporterTransportTakenOverAt: bsvhu.emitterEmissionSignatureDate }
    );
  }

  return bsvhus.length;
}
