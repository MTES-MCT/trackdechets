import {
  CreateTraderReceiptInput,
  TraderReceipt
} from "../../../generated/types";
import { prisma } from "../../../generated/prisma-client";

/**
 * Create a trader receipt
 * @param input
 */
export default async function createTraderReceipt(
  input: CreateTraderReceiptInput
): Promise<TraderReceipt> {
  return prisma.createTraderReceipt(input);
}
