import { logger } from "@td/logger";
import { Prisma } from "@td/prisma";

const FIX_DATE = new Date("1970-01-01T00:00:00.000Z");
const SCHEMA_NAME = "default$default";
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fixes all dates before 1900-01-01 by setting them to 1970-01-01
 * This script uses raw SQL to efficiently update all problematic dates across all tables
 * Includes heartbeat logging to keep dyno alive and traceability logging of original records
 */
export async function run(tx: Prisma.TransactionClient) {
  logger.info("Starting fix for dates before 1900-01-01");

  const fixDate = FIX_DATE.toISOString();

  // Set up heartbeat to keep dyno alive (logs every 5 minutes)
  const heartbeatInterval = setInterval(() => {
    logger.info("💓 Heartbeat: Script still running...");
  }, HEARTBEAT_INTERVAL_MS);

  // Clean up interval on completion or error
  const cleanup = () => {
    clearInterval(heartbeatInterval);
  };

  try {
    // List of all table.column pairs that need to be checked and updated
    const updates: Array<{
      table: string;
      column: string;
      isNullable: boolean;
    }> = [
      // AccessToken
      { table: "AccessToken", column: "createdAt", isNullable: false },
      { table: "AccessToken", column: "updatedAt", isNullable: false },
      { table: "AccessToken", column: "lastUsed", isNullable: true },

      // Application
      { table: "Application", column: "createdAt", isNullable: false },
      { table: "Application", column: "updatedAt", isNullable: false },

      // Company
      { table: "Company", column: "updatedAt", isNullable: false },
      { table: "Company", column: "createdAt", isNullable: false },
      { table: "Company", column: "verifiedAt", isNullable: true },
      { table: "Company", column: "isDormantSince", isNullable: true },
      {
        table: "Company",
        column: "hasEnabledRegistryDndFromBsdSince",
        isNullable: true
      },

      // Form (BSDD)
      { table: "Form", column: "createdAt", isNullable: false },
      { table: "Form", column: "updatedAt", isNullable: false },
      { table: "Form", column: "traderValidityLimit", isNullable: true },
      { table: "Form", column: "brokerValidityLimit", isNullable: true },
      { table: "Form", column: "emittedAt", isNullable: true },
      { table: "Form", column: "takenOverAt", isNullable: true },
      { table: "Form", column: "signedAt", isNullable: true },
      { table: "Form", column: "sentAt", isNullable: true },
      { table: "Form", column: "receivedAt", isNullable: true },
      { table: "Form", column: "processedAt", isNullable: true },

      // BsddRevisionRequest
      { table: "BsddRevisionRequest", column: "createdAt", isNullable: false },
      { table: "BsddRevisionRequest", column: "updatedAt", isNullable: false },
      {
        table: "BsddRevisionRequest",
        column: "brokerValidityLimit",
        isNullable: true
      },
      {
        table: "BsddRevisionRequest",
        column: "traderValidityLimit",
        isNullable: true
      },

      // BsddRevisionRequestApproval
      {
        table: "BsddRevisionRequestApproval",
        column: "createdAt",
        isNullable: false
      },
      {
        table: "BsddRevisionRequestApproval",
        column: "updatedAt",
        isNullable: false
      },

      // Grant
      { table: "Grant", column: "createdAt", isNullable: false },
      { table: "Grant", column: "updatedAt", isNullable: false },

      // MembershipRequest
      { table: "MembershipRequest", column: "createdAt", isNullable: false },
      { table: "MembershipRequest", column: "updatedAt", isNullable: false },

      // StatusLog
      { table: "StatusLog", column: "loggedAt", isNullable: true },

      // TraderReceipt, BrokerReceipt, TransporterReceipt
      { table: "TraderReceipt", column: "validityLimit", isNullable: false },
      { table: "BrokerReceipt", column: "validityLimit", isNullable: false },
      {
        table: "TransporterReceipt",
        column: "validityLimit",
        isNullable: false
      },

      // WorkerCertification
      {
        table: "WorkerCertification",
        column: "validityLimit",
        isNullable: true
      },

      // BsddTransporter
      {
        table: "BsddTransporter",
        column: "transporterValidityLimit",
        isNullable: true
      },
      { table: "BsddTransporter", column: "takenOverAt", isNullable: true },
      { table: "BsddTransporter", column: "createdAt", isNullable: false },
      { table: "BsddTransporter", column: "updatedAt", isNullable: false },

      // User
      { table: "User", column: "passwordUpdatedAt", isNullable: true },
      { table: "User", column: "createdAt", isNullable: false },
      { table: "User", column: "updatedAt", isNullable: false },
      { table: "User", column: "activatedAt", isNullable: true },
      { table: "User", column: "firstAssociationDate", isNullable: true },
      { table: "User", column: "totpActivatedAt", isNullable: true },
      { table: "User", column: "totpLockedUntil", isNullable: true },
      { table: "User", column: "trackingConsentUntil", isNullable: true },

      // UserAccountHash
      { table: "UserAccountHash", column: "createdAt", isNullable: false },
      { table: "UserAccountHash", column: "updatedAt", isNullable: false },
      { table: "UserAccountHash", column: "acceptedAt", isNullable: true },

      // UserActivationHash
      { table: "UserActivationHash", column: "createdAt", isNullable: false },
      { table: "UserActivationHash", column: "updatedAt", isNullable: false },

      // UserResetPasswordHash
      {
        table: "UserResetPasswordHash",
        column: "hashExpires",
        isNullable: false
      },
      {
        table: "UserResetPasswordHash",
        column: "createdAt",
        isNullable: false
      },

      // Bsvhu
      { table: "Bsvhu", column: "createdAt", isNullable: false },
      { table: "Bsvhu", column: "updatedAt", isNullable: false },
      {
        table: "Bsvhu",
        column: "emitterEmissionSignatureDate",
        isNullable: true
      },
      {
        table: "Bsvhu",
        column: "destinationOperationSignatureDate",
        isNullable: true
      },
      { table: "Bsvhu", column: "destinationOperationDate", isNullable: true },
      { table: "Bsvhu", column: "destinationReceptionDate", isNullable: true },
      {
        table: "Bsvhu",
        column: "destinationReceptionSignatureDate",
        isNullable: true
      },
      {
        table: "Bsvhu",
        column: "transporterTransportSignatureDate",
        isNullable: true
      },
      {
        table: "Bsvhu",
        column: "brokerRecepisseValidityLimit",
        isNullable: true
      },
      {
        table: "Bsvhu",
        column: "traderRecepisseValidityLimit",
        isNullable: true
      },

      // BsvhuTransporter
      { table: "BsvhuTransporter", column: "createdAt", isNullable: false },
      { table: "BsvhuTransporter", column: "updatedAt", isNullable: false },
      {
        table: "BsvhuTransporter",
        column: "transporterRecepisseValidityLimit",
        isNullable: true
      },
      {
        table: "BsvhuTransporter",
        column: "transporterTransportTakenOverAt",
        isNullable: true
      },
      {
        table: "BsvhuTransporter",
        column: "transporterTransportSignatureDate",
        isNullable: true
      },

      // RegistryDelegation
      { table: "RegistryDelegation", column: "createdAt", isNullable: false },
      { table: "RegistryDelegation", column: "updatedAt", isNullable: false },
      { table: "RegistryDelegation", column: "startDate", isNullable: false },
      { table: "RegistryDelegation", column: "endDate", isNullable: true },

      // Bsdasri
      { table: "Bsdasri", column: "createdAt", isNullable: false },
      { table: "Bsdasri", column: "updatedAt", isNullable: false },
      {
        table: "Bsdasri",
        column: "emitterEmissionSignatureDate",
        isNullable: true
      },
      {
        table: "Bsdasri",
        column: "transporterRecepisseValidityLimit",
        isNullable: true
      },
      { table: "Bsdasri", column: "transporterTakenOverAt", isNullable: true },
      {
        table: "Bsdasri",
        column: "transporterTransportSignatureDate",
        isNullable: true
      },
      { table: "Bsdasri", column: "handedOverToRecipientAt", isNullable: true },
      {
        table: "Bsdasri",
        column: "destinationReceptionDate",
        isNullable: true
      },
      {
        table: "Bsdasri",
        column: "destinationOperationDate",
        isNullable: true
      },
      {
        table: "Bsdasri",
        column: "destinationReceptionSignatureDate",
        isNullable: true
      },
      {
        table: "Bsdasri",
        column: "destinationOperationSignatureDate",
        isNullable: true
      },
      {
        table: "Bsdasri",
        column: "brokerRecepisseValidityLimit",
        isNullable: true
      },
      {
        table: "Bsdasri",
        column: "traderRecepisseValidityLimit",
        isNullable: true
      },

      // BsdasriFinalOperation
      {
        table: "BsdasriFinalOperation",
        column: "createdAt",
        isNullable: false
      },
      {
        table: "BsdasriFinalOperation",
        column: "updatedAt",
        isNullable: false
      },

      // BsdasriRevisionRequest
      {
        table: "BsdasriRevisionRequest",
        column: "createdAt",
        isNullable: false
      },
      {
        table: "BsdasriRevisionRequest",
        column: "updatedAt",
        isNullable: false
      },

      // BsdasriRevisionRequestApproval
      {
        table: "BsdasriRevisionRequestApproval",
        column: "createdAt",
        isNullable: false
      },
      {
        table: "BsdasriRevisionRequestApproval",
        column: "updatedAt",
        isNullable: false
      },

      // Bsff
      { table: "Bsff", column: "createdAt", isNullable: false },
      { table: "Bsff", column: "updatedAt", isNullable: false },
      {
        table: "Bsff",
        column: "emitterEmissionSignatureDate",
        isNullable: true
      },
      {
        table: "Bsff",
        column: "transporterTransportSignatureDate",
        isNullable: true
      },
      { table: "Bsff", column: "destinationReceptionDate", isNullable: true },
      {
        table: "Bsff",
        column: "destinationReceptionSignatureDate",
        isNullable: true
      },

      // BsffTransporter
      { table: "BsffTransporter", column: "createdAt", isNullable: false },
      { table: "BsffTransporter", column: "updatedAt", isNullable: false },
      {
        table: "BsffTransporter",
        column: "transporterRecepisseValidityLimit",
        isNullable: true
      },
      {
        table: "BsffTransporter",
        column: "transporterTransportTakenOverAt",
        isNullable: true
      },
      {
        table: "BsffTransporter",
        column: "transporterTransportSignatureDate",
        isNullable: true
      },

      // BsffPackagingFinalOperation
      {
        table: "BsffPackagingFinalOperation",
        column: "createdAt",
        isNullable: false
      },
      {
        table: "BsffPackagingFinalOperation",
        column: "updatedAt",
        isNullable: false
      },

      // BsffFicheIntervention
      {
        table: "BsffFicheIntervention",
        column: "createdAt",
        isNullable: false
      },
      {
        table: "BsffFicheIntervention",
        column: "updatedAt",
        isNullable: false
      },

      // BsffPackaging
      { table: "BsffPackaging", column: "acceptationDate", isNullable: true },
      {
        table: "BsffPackaging",
        column: "acceptationSignatureDate",
        isNullable: true
      },
      { table: "BsffPackaging", column: "operationDate", isNullable: true },
      {
        table: "BsffPackaging",
        column: "operationSignatureDate",
        isNullable: true
      },

      // Bsda
      { table: "Bsda", column: "createdAt", isNullable: false },
      { table: "Bsda", column: "updatedAt", isNullable: false },
      {
        table: "Bsda",
        column: "emitterEmissionSignatureDate",
        isNullable: true
      },
      { table: "Bsda", column: "destinationReceptionDate", isNullable: true },
      { table: "Bsda", column: "destinationOperationDate", isNullable: true },
      {
        table: "Bsda",
        column: "destinationOperationSignatureDate",
        isNullable: true
      },
      {
        table: "Bsda",
        column: "destinationReceptionSignatureDate",
        isNullable: true
      },
      {
        table: "Bsda",
        column: "transporterTransportSignatureDate",
        isNullable: true
      },
      { table: "Bsda", column: "workerWorkSignatureDate", isNullable: true },
      {
        table: "Bsda",
        column: "workerCertificationValidityLimit",
        isNullable: true
      },
      {
        table: "Bsda",
        column: "brokerRecepisseValidityLimit",
        isNullable: true
      },

      // BsdaFinalOperation
      { table: "BsdaFinalOperation", column: "createdAt", isNullable: false },
      { table: "BsdaFinalOperation", column: "updatedAt", isNullable: false },

      // BsdaTransporter
      { table: "BsdaTransporter", column: "createdAt", isNullable: false },
      { table: "BsdaTransporter", column: "updatedAt", isNullable: false },
      {
        table: "BsdaTransporter",
        column: "transporterRecepisseValidityLimit",
        isNullable: true
      },
      {
        table: "BsdaTransporter",
        column: "transporterTransportTakenOverAt",
        isNullable: true
      },
      {
        table: "BsdaTransporter",
        column: "transporterTransportSignatureDate",
        isNullable: true
      },

      // BsdaRevisionRequest
      { table: "BsdaRevisionRequest", column: "createdAt", isNullable: false },
      { table: "BsdaRevisionRequest", column: "updatedAt", isNullable: false },

      // BsdaRevisionRequestApproval
      {
        table: "BsdaRevisionRequestApproval",
        column: "createdAt",
        isNullable: false
      },
      {
        table: "BsdaRevisionRequestApproval",
        column: "updatedAt",
        isNullable: false
      },

      // Bspaoh
      { table: "Bspaoh", column: "createdAt", isNullable: false },
      { table: "Bspaoh", column: "updatedAt", isNullable: false },
      {
        table: "Bspaoh",
        column: "emitterEmissionSignatureDate",
        isNullable: true
      },
      {
        table: "Bspaoh",
        column: "transporterTransportTakenOverAt",
        isNullable: true
      },
      {
        table: "Bspaoh",
        column: "handedOverToDestinationSignatureDate",
        isNullable: true
      },
      { table: "Bspaoh", column: "destinationReceptionDate", isNullable: true },
      {
        table: "Bspaoh",
        column: "destinationReceptionSignatureDate",
        isNullable: true
      },
      { table: "Bspaoh", column: "destinationOperationDate", isNullable: true },
      {
        table: "Bspaoh",
        column: "destinationOperationSignatureDate",
        isNullable: true
      },

      // BspaohTransporter
      { table: "BspaohTransporter", column: "createdAt", isNullable: false },
      { table: "BspaohTransporter", column: "updatedAt", isNullable: false },
      {
        table: "BspaohTransporter",
        column: "transporterRecepisseValidityLimit",
        isNullable: true
      },
      {
        table: "BspaohTransporter",
        column: "transporterTakenOverAt",
        isNullable: true
      },
      {
        table: "BspaohTransporter",
        column: "transporterTransportSignatureDate",
        isNullable: true
      },

      // PdfAccessToken
      { table: "PdfAccessToken", column: "createdAt", isNullable: false },
      { table: "PdfAccessToken", column: "expiresAt", isNullable: false },
      { table: "PdfAccessToken", column: "lastUsed", isNullable: true },
      { table: "PdfAccessToken", column: "visitedAt", isNullable: true },

      // WebhookSetting
      { table: "WebhookSetting", column: "createdAt", isNullable: false },

      // MigrationScript
      { table: "MigrationScript", column: "startedAt", isNullable: false },
      { table: "MigrationScript", column: "finishedAt", isNullable: true },

      // CompanyDigest
      { table: "CompanyDigest", column: "createdAt", isNullable: false },
      { table: "CompanyDigest", column: "updatedAt", isNullable: false },

      // AdministrativeTransfer
      {
        table: "AdministrativeTransfer",
        column: "createdAt",
        isNullable: false
      },
      {
        table: "AdministrativeTransfer",
        column: "updatedAt",
        isNullable: false
      },
      {
        table: "AdministrativeTransfer",
        column: "approvedAt",
        isNullable: true
      },

      // AdminRequest
      { table: "AdminRequest", column: "createdAt", isNullable: false },
      { table: "AdminRequest", column: "updatedAt", isNullable: false },
      { table: "AdminRequest", column: "adminOnlyEndDate", isNullable: true }
    ];

    let totalUpdated = 0;

    for (const { table, column, isNullable } of updates) {
      try {
        // Build the WHERE clause based on whether the column is nullable
        const whereClause = isNullable
          ? `"${column}" IS NOT NULL AND "${column}" < '1900-01-01'::timestamp`
          : `"${column}" < '1900-01-01'::timestamp`;

        // First, query records to log original information for traceability
        const selectQuery = `
        SELECT id::text as id, "${column}"::text as original_date
        FROM "${SCHEMA_NAME}"."${table}"
        WHERE ${whereClause}
        ORDER BY id
      `;

        const records = await tx.$queryRawUnsafe<
          Array<{ id: string; original_date: string }>
        >(selectQuery);

        // Log original record information for traceability
        if (records.length > 0) {
          logger.info(
            `Found ${records.length} record(s) to update in ${table}.${column}:`
          );
          for (const record of records) {
            logger.info(
              `  - Table: ${table}, ID: ${record.id}, Column: ${column}, Original Date: ${record.original_date}`
            );
          }
        }

        // Now perform the update
        const updateQuery = `
        UPDATE "${SCHEMA_NAME}"."${table}"
        SET "${column}" = $1::timestamptz
        WHERE ${whereClause}
      `;

        const result = await tx.$executeRawUnsafe(updateQuery, fixDate);
        const count = typeof result === "number" ? result : 0;

        if (count > 0) {
          logger.info(
            `✅ Updated ${count} row(s) in ${table}.${column} (dates before 1900 -> 1970-01-01)`
          );
          totalUpdated += count;
        }
      } catch (error) {
        logger.error(`Error updating ${table}.${column}:`, error);
        cleanup();
        throw error;
      }
    }

    cleanup();
    logger.info(`✅ Completed: Fixed ${totalUpdated} total problematic dates`);
  } catch (error) {
    cleanup();
    logger.error("Fatal error in date fix script:", error);
    throw error;
  }
}
