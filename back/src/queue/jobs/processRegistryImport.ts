import { logger } from "@td/logger";
import { prisma } from "@td/prisma";
import {
  getFileMetadata,
  getFileAsStream,
  getUploadWithWritableStream,
  ImportType,
  processStream,
  setFileAsNotTemporary
} from "@td/registry";
import { Job } from "bull";
import { format } from "date-fns";
import { parse } from "node:path";

import { getUserCompanies } from "../../users/database";
import { getDelegatorsByDelegateForEachCompanies } from "../../registryDelegation/database";
import { getUserRoles, Permission, can } from "../../permissions";

export type RegistryImportJobArgs = {
  importId: string;
  importType: ImportType;
  s3FileKey: string;
};

const allowedCsvMimeTypes = ["text/csv"];

const allowedExcelMimeTypes = [
  "application/vnd.ms-excel",
  "application/msexcel",
  "application/x-msexcel",
  "application/x-ms-excel",
  "application/x-excel",
  "application/x-dos_ms_excel",
  "application/xls",
  "application/x-xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
];

export async function processRegistryImportJob(
  job: Job<RegistryImportJobArgs>
) {
  const { importId, importType, s3FileKey } = job.data;

  const metadata = await getFileMetadata(
    process.env.S3_REGISTRY_IMPORTS_BUCKET!,
    s3FileKey
  );
  if (!metadata) {
    throw new Error(`Unknown file "${s3FileKey}", import "${importId}".`);
  }

  const fileType = getFileType(metadata.ContentType);
  if (!fileType) {
    throw new Error(
      `Unknown file type for file "${s3FileKey}", import "${importId}". Received content type "${metadata.ContentType}".`
    );
  }

  await setFileAsNotTemporary(
    process.env.S3_REGISTRY_IMPORTS_BUCKET!,
    s3FileKey
  );

  const inputStream = await getFileAsStream(
    process.env.S3_REGISTRY_IMPORTS_BUCKET!,
    s3FileKey
  );

  if (!inputStream) {
    throw new Error(
      `File "${s3FileKey}" not found in S3 for import "${importId}"`
    );
  }

  const registryImport = await prisma.registryImport.findUniqueOrThrow({
    where: { id: importId }
  });
  const creatorCompanies = await getUserCompanies(registryImport.createdById);
  const userRoles = await getUserRoles(registryImport.createdById);
  const allowedSirets = creatorCompanies.map(company => company.orgId);
  const allowedWithRolesSirets = creatorCompanies
    .filter(company =>
      can(userRoles[company.orgId], Permission.RegistryCanImport)
    )
    .map(company => company.orgId);
  const allowedCompanyIds = creatorCompanies.map(company => company.id);

  const delegatorSiretsByDelegateSirets =
    await getDelegatorsByDelegateForEachCompanies(allowedCompanyIds);

  const parsedOriginalFileName = parse(registryImport.originalFileName);
  const { s3Stream: outputErrorStream, upload } = getUploadWithWritableStream({
    bucketName: process.env.S3_REGISTRY_ERRORS_BUCKET!,
    key: registryImport.s3FileKey,
    metadata: {
      filename: `${format(new Date(), "yyyyMMdd")}_TD_rapport_erreur_${
        parsedOriginalFileName.name
      }.${fileType === "CSV" ? "csv" : "xlsx"}`
    }
  });

  const stats = await processStream({
    importId,
    importType,
    fileType,
    inputStream,
    outputErrorStream,
    createdById: registryImport.createdById,
    allowedSirets,
    allowedWithRolesSirets,
    delegatorSiretsByDelegateSirets
  });

  if (stats.errors > 0) {
    const result = await upload.done();
    logger.info(`Done uploading error file for import ${importId} to S3`, {
      key: result.Key,
      location: result.Location
    });
  }

  logger.info(`Finished processing import ${importId}`, { importId, stats });
}

function getFileType(mimeType: string | undefined) {
  if (!mimeType) {
    return undefined;
  }

  if (allowedCsvMimeTypes.includes(mimeType)) {
    return "CSV";
  }

  if (allowedExcelMimeTypes.includes(mimeType)) {
    return "XLSX";
  }

  return undefined;
}
