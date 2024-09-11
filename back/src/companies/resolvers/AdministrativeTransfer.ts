import { prisma } from "@td/prisma";
import {
  AdministrativeTransfer,
  AdministrativeTransferResolvers
} from "../../generated/graphql/types";

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
