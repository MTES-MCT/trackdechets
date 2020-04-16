import { prisma } from "../../../generated/prisma-client";
import { DeleteTraderReceiptInput } from "../../../generated/types";

/**
 * Delete a trader receipt
 * @param id
 */
export default function deleteTraderReceipt({ id }: DeleteTraderReceiptInput) {
  return prisma.deleteTraderReceipt({ id });
}
