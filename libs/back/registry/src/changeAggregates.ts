import { RegistryImportType, RegistrySource } from "@td/prisma";
import { prisma } from "@td/prisma";
import { getCachedCompany } from "./shared/helpers";

export type RegistryChanges = {
  errors: number;
  insertions: number;
  edits: number;
  cancellations: number;
  skipped: number;
};

export type RegistryChangesByCompany = Map<
  string,
  { [reportAsSiret: string]: RegistryChanges }
>;

const SLIDING_AGGREGATE_WINDOW = 1 * 60 * 1000; // If you push update in that window, it will be added to the previous one
const MAX_AGGREGATE_WINDOW = 5 * 60 * 1000; // Maximum window between the creation and an update

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

  for (const changesByReporter of changesByCompany.values()) {
    for (const changes of Object.values(changesByReporter)) {
      globalChanges.insertions += changes.insertions;
      globalChanges.edits += changes.edits;
      globalChanges.cancellations += changes.cancellations;
      globalChanges.skipped += changes.skipped;
    }
  }

  globalChanges.errors += globalErrorNumber;

  return globalChanges;
}

export function incrementLocalChangesForCompany(
  changesByCompany: RegistryChangesByCompany,
  {
    reason,
    reportForCompanySiret,
    reportAsCompanySiret,
    increments = 1
  }: {
    reason: "MODIFIER" | "ANNULER" | "IGNORER" | null | undefined;
    reportForCompanySiret: string;
    reportAsCompanySiret: string;
    increments?: number;
  }
) {
  if (!changesByCompany.has(reportForCompanySiret)) {
    changesByCompany.set(reportForCompanySiret, {
      [reportAsCompanySiret]: getEmptyChanges()
    });
  }

  const changesByReporter = changesByCompany.get(reportForCompanySiret)!;
  if (!changesByReporter[reportAsCompanySiret]) {
    changesByReporter[reportAsCompanySiret] = getEmptyChanges();
  }

  const companyStats = changesByReporter[reportAsCompanySiret];

  switch (reason) {
    case "MODIFIER":
      companyStats.edits += increments;
      break;
    case "ANNULER":
      companyStats.cancellations += increments;
      break;
    case "IGNORER":
      companyStats.skipped += increments;
      break;
    default:
      companyStats.insertions += increments;
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
    async ([siret, changesByReporter]) => {
      const company = await getCachedCompany(siret);

      if (!company) {
        return;
      }

      for (const [reportAsSiret, changes] of Object.entries(
        changesByReporter
      )) {
        const reportAsCompany = await getCachedCompany(reportAsSiret);

        if (!reportAsCompany) {
          continue;
        }

        await saveRegistryChanges(changes, {
          createdById,
          reportForId: company.id,
          reportAsId: reportAsCompany.id,
          type,
          source
        });
      }
    }
  );

  await Promise.all(promises);
}

export async function saveRegistryChanges(
  registryChanges: RegistryChanges,
  {
    createdById,
    reportForId,
    reportAsId,
    type,
    source
  }: {
    createdById: string;
    reportForId: string;
    reportAsId?: string;
    type: RegistryImportType;
    source: RegistrySource;
  }
) {
  const existingChangeAggregate =
    await prisma.registryChangeAggregate.findFirst({
      where: {
        createdById,
        reportForId,
        reportAsId,
        type,
        source,
        updatedAt: {
          gte: new Date(Date.now() - SLIDING_AGGREGATE_WINDOW)
        },
        createdAt: {
          gte: new Date(Date.now() - MAX_AGGREGATE_WINDOW)
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
      reportForId,
      reportAsId,
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
