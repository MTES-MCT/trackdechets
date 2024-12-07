import { prisma } from "@td/prisma";
import type {
  AdministrativeTransfer,
  AdministrativeTransferResolvers
} from "@td/codegen-back";

const administrativeTransferResolver: AdministrativeTransferResolvers = {
  from: async (parent: AdministrativeTransfer & { fromId: string }) => {
    return prisma.company.findUniqueOrThrow({
      where: { id: parent.fromId }
    }) as any;
  },
  to: async (parent: AdministrativeTransfer & { toId: string }) => {
    return prisma.company.findUniqueOrThrow({
      where: { id: parent.toId }
    }) as any;
  }
};

export default administrativeTransferResolver;
