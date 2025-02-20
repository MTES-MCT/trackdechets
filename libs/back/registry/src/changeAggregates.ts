import { RegistryImportType, RegistrySource } from "@prisma/client";
import { prisma } from "@td/prisma";
import { getCachedCompany } from "./shared/helpers";

export type RegistryChanges = {
  errors: number;
  insertions: number;
  edits: number;
  cancellations: number;
  skipped: number;
};

export type RegistryChangesByCompany = Map<string, RegistryChanges>;

const AGGREGATE_WINDOW = 3 * 60 * 1000;

export function getEmptyChanges(): RegistryChanges {
  return {
    errors: 0,
    insertions: 0,
    edits: 0,
    cancellations: 0,
    skipped: 0
  };
}

export function getSumOfChanges(
  changesByCompany: RegistryChangesByCompany,
  globalErrorNumber = 0
) {
  const globalChanges = getEmptyChanges();

  for (const changes of changesByCompany.values()) {
    globalChanges.insertions += changes.insertions;
    globalChanges.edits += changes.edits;
    globalChanges.cancellations += changes.cancellations;
    globalChanges.skipped += changes.skipped;
  }

  globalChanges.errors += globalErrorNumber;

  return globalChanges;
}

export function incrementLocalChangesForCompany(
  changesByCompany: RegistryChangesByCompany,
  {
    reason,
    reportForCompanySiret
  }: {
    reason: "MODIFIER" | "ANNULER" | "IGNORER" | null | undefined;
    reportForCompanySiret: string;
  }
) {
  if (!changesByCompany.has(reportForCompanySiret)) {
    changesByCompany.set(reportForCompanySiret, getEmptyChanges());
  }

  const companyStats = changesByCompany.get(
    reportForCompanySiret
  ) as RegistryChanges;

  switch (reason) {
    case "MODIFIER":
      companyStats.edits++;
      break;
    case "ANNULER":
      companyStats.cancellations++;
      break;
    case "IGNORER":
      companyStats.skipped++;
      break;
    default:
      companyStats.insertions++;
      break;
  }
}

export async function saveCompaniesChanges(
  changesByCompany: RegistryChangesByCompany,
  {
    createdById,
    type,
    source
  }: { type: RegistryImportType; source: RegistrySource; createdById: string }
) {
  const promises = Array.from(changesByCompany.entries()).map(
    async ([siret, changes]) => {
      const company = await getCachedCompany(siret);

      if (!company) {
        return;
      }

      await saveRegistryChanges(changes, {
        createdById,
        companyId: company.id,
        type,
        source
      });
    }
  );

  await Promise.all(promises);
}

export async function saveRegistryChanges(
  registryChanges: RegistryChanges,
  {
    createdById,
    companyId,
    type,
    source
  }: {
    createdById: string;
    companyId: string;
    type: RegistryImportType;
    source: RegistrySource;
  }
) {
  const existingChangeAggregate =
    await prisma.registryChangeAggregate.findFirst({
      where: {
        createdById,
        companyId,
        type,
        source,
        updatedAt: {
          gte: new Date(Date.now() - AGGREGATE_WINDOW)
        }
      }
    });

  if (existingChangeAggregate) {
    return prisma.registryChangeAggregate.update({
      where: { id: existingChangeAggregate.id },
      data: {
        numberOfAggregates: {
          increment: 1
        },
        numberOfErrors: {
          increment: registryChanges.errors
        },
        numberOfInsertions: {
          increment: registryChanges.insertions
        },
        numberOfEdits: {
          increment: registryChanges.edits
        },
        numberOfCancellations: {
          increment: registryChanges.cancellations
        },
        numberOfSkipped: {
          increment: registryChanges.skipped
        }
      }
    });
  }

  return prisma.registryChangeAggregate.create({
    data: {
      createdById,
      companyId,
      type,
      source,
      numberOfErrors: registryChanges.errors,
      numberOfInsertions: registryChanges.insertions,
      numberOfEdits: registryChanges.edits,
      numberOfCancellations: registryChanges.cancellations,
      numberOfSkipped: registryChanges.skipped
    }
  });
}
