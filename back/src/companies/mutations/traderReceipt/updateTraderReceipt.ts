import {
  UpdateTraderReceiptInput,
  TraderReceipt
} from "../../../generated/types";
import { prisma } from "../../../generated/prisma-client";

/**
 * Update a trader receipt
 * @param input
 */
export default async function updateTraderReceipt(
  input: UpdateTraderReceiptInput
): Promise<TraderReceipt> {
  const { id, ...data } = input;
  return prisma.updateTraderReceipt({ data, where: { id } });
}
