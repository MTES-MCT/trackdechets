import {
  UpdateTransporterReceiptInput,
  TransporterReceipt
} from "../../../generated/types";
import { prisma } from "../../../generated/prisma-client";

/**
 * Update a transporter receipt
 * @param input
 */
export default async function updateTransporterReceipt(
  input: UpdateTransporterReceiptInput
): Promise<TransporterReceipt> {
  const { id, ...data } = input;
  return prisma.updateTransporterReceipt({ data, where: { id } });
}
