import { getBsvhuRepository } from "../../bsvhu/repository";
import { prisma } from "@td/prisma";

type QueryRawReturnType = {
  id: string;
  emitterEmissionSignatureDate: Date;
  transporterTransportTakenOverAt: Date;
}[];

type UpdateBsddTakenOvetAtProps = {
  gte: Date;
  lte: Date;
};

/**
 * BSVHU - Set transporterTransportTakenOverAt = emitterEmissionSignatureDate when transporterTransportTakenOverAt < emitterEmissionSignatureDate
 */
export async function updateBsvhuTakenOverAt({
  gte,
  lte
}: UpdateBsddTakenOvetAtProps) {
  const bsvhus = await prisma.$queryRaw<QueryRawReturnType>`
    SELECT "id", "emitterEmissionSignatureDate", "transporterTransportTakenOverAt" FROM "default$default"."Bsvhu" 
    WHERE "emitterEmissionSignatureDate" > "transporterTransportTakenOverAt"
    AND "isDeleted" = false
    AND "emitterEmissionSignatureDate" >= ${gte}
    AND "emitterEmissionSignatureDate" <= ${lte};`;
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
