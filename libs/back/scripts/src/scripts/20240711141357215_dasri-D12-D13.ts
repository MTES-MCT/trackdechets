import { Prisma } from "@prisma/client";

export async function run(tx: Prisma.TransactionClient) {
  await tx.bsdasri.updateMany({
    where: { destinationOperationCode: "D12" },
    data: { destinationOperationCode: "D13", destinationOperationMode: null }
  });
}
