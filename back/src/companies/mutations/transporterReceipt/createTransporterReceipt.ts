import {
  CreateTransporterReceiptInput,
  TransporterReceipt
} from "../../../generated/types";
import { prisma } from "../../../generated/prisma-client";

/**
 * Create a transporter receipt
 * @param input
 */
export default async function createTransporterReceipt(
  input: CreateTransporterReceiptInput
): Promise<TransporterReceipt> {
  return prisma.createTransporterReceipt(input);
}
