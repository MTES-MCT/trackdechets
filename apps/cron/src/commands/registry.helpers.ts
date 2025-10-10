import { RegistryExportStatus, RegistryImportStatus } from "@prisma/client";
import { subDays } from "date-fns";
import { prisma } from "@td/prisma";

export async function cleanPendingRegistry() {
  await prisma.registryImport.updateMany({
    where: {
      createdAt: {
        lt: subDays(new Date(), 1)
      },
      OR: [
        {
          status: RegistryImportStatus.PENDING
        },
        {
          status: RegistryImportStatus.STARTED
        }
      ]
    },
    data: {
      status: RegistryImportStatus.FAILED
    }
  });
  await prisma.registryExport.updateMany({
    where: {
      createdAt: {
        lt: subDays(new Date(), 1)
      },
      OR: [
        {
          status: RegistryExportStatus.PENDING
        },
        {
          status: RegistryExportStatus.STARTED
        }
      ]
    },
    data: {
      status: RegistryExportStatus.FAILED
    }
  });
  await prisma.registryExhaustiveExport.updateMany({
    where: {
      createdAt: {
        lt: subDays(new Date(), 1)
      },
      OR: [
        {
          status: RegistryExportStatus.PENDING
        },
        {
          status: RegistryExportStatus.STARTED
        }
      ]
    },
    data: {
      status: RegistryExportStatus.FAILED
    }
  });
}
