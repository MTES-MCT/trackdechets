import { logger } from "@td/logger";
import { Prisma } from "@td/prisma";
import { writeFile, appendFile } from "fs/promises";
import { join } from "path";

const FIX_DATE = new Date("1970-01-01T00:00:00.000Z");
const SCHEMA_NAME = "default$default";
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// CSV file will be created next to the script
// Using __dirname which is available after TypeScript compilation to CommonJS
const CSV_FILE_PATH = join(
  __dirname,
  "20260311000123428_fix_remaining_dates_before_1900_traceability.csv"
);

/**
 * Fixes remaining dates before 1900-01-01 (columns that were missing from the first script).
 * Sets them to 1970-01-01. Uses raw SQL; includes heartbeat and traceability CSV.
 */
/**
 * Escapes a value for CSV format
 */
function escapeCsvValue(value: string): string {
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function run(tx: Prisma.TransactionClient) {
  logger.info("Starting fix for remaining dates before 1900-01-01");
  logger.info(`CSV traceability file will be written to: ${CSV_FILE_PATH}`);

  const fixDate = FIX_DATE.toISOString();

  // Initialize CSV file with headers
  const csvHeader = "table,id,column,original_date\n";
  await writeFile(CSV_FILE_PATH, csvHeader, "utf-8");
  logger.info("CSV traceability file initialized");

  // Set up heartbeat to keep dyno alive (logs every 5 minutes)
  const heartbeatInterval = setInterval(() => {
    logger.info("💓 Heartbeat: Script still running...");
  }, HEARTBEAT_INTERVAL_MS);

  // Clean up interval on completion or error
  const cleanup = () => {
    clearInterval(heartbeatInterval);
  };

  try {
    // Columns that were missing from 20251120171331767_fix_dates_before_1900 (only these are updated)
    const updates: Array<{
      table: string;
      column: string;
      isNullable: boolean;
    }> = [
      // BsddRevisionRequest (initial* validity limits)
      {
        table: "BsddRevisionRequest",
        column: "initialBrokerValidityLimit",
        isNullable: true
      },
      {
        table: "BsddRevisionRequest",
        column: "initialTraderValidityLimit",
        isNullable: true
      },

      // BsddFinalOperation
      { table: "BsddFinalOperation", column: "createdAt", isNullable: false },
      { table: "BsddFinalOperation", column: "updatedAt", isNullable: false },

      // IntermediaryFormAssociation
      {
        table: "IntermediaryFormAssociation",
        column: "createdAt",
        isNullable: false
      },

      // BsdaRevisionRequest (validity limits)
      {
        table: "BsdaRevisionRequest",
        column: "brokerRecepisseValidityLimit",
        isNullable: true
      },
      {
        table: "BsdaRevisionRequest",
        column: "initialBrokerRecepisseValidityLimit",
        isNullable: true
      },

      // AnonymousCompany
      { table: "AnonymousCompany", column: "createdAt", isNullable: true },

      // CompanyAssociation
      { table: "CompanyAssociation", column: "createdAt", isNullable: true },

      // IntermediaryBsvhuAssociation
      {
        table: "IntermediaryBsvhuAssociation",
        column: "createdAt",
        isNullable: false
      },

      // IntermediaryBsdasriAssociation
      {
        table: "IntermediaryBsdasriAssociation",
        column: "createdAt",
        isNullable: false
      },

      // IntermediaryBsdaAssociation
      {
        table: "IntermediaryBsdaAssociation",
        column: "createdAt",
        isNullable: false
      },

      // Event
      { table: "Event", column: "createdAt", isNullable: false }
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

          // Write records to CSV file for traceability
          const csvLines = records.map(record => {
            const csvRow = [
              escapeCsvValue(table),
              escapeCsvValue(record.id),
              escapeCsvValue(column),
              escapeCsvValue(record.original_date)
            ].join(",");
            return csvRow;
          });

          await appendFile(CSV_FILE_PATH, csvLines.join("\n") + "\n", "utf-8");

          for (const record of records) {
            logger.info(
              `  - Table: ${table}, ID: ${record.id}, Column: ${column}, Original Date: ${record.original_date}`
            );
          }

          // Now perform the update using the IDs from the query
          // Build IN clause with the IDs we found
          const ids = records.map(r => r.id);
          // Escape and quote each ID for the IN clause
          // Since IDs come from the database query, they're safe, but we still quote them
          const quotedIds = ids.map(id => `'${id}'`).join(", ");
          const updateQuery = `
            UPDATE "${SCHEMA_NAME}"."${table}"
            SET "${column}" = $1::timestamptz
            WHERE id::text IN (${quotedIds})
          `;

          const result = await tx.$executeRawUnsafe(updateQuery, fixDate);
          const count = typeof result === "number" ? result : 0;

          if (count > 0) {
            logger.info(
              `✅ Updated ${count} row(s) in ${table}.${column} (dates before 1900 -> 1970-01-01)`
            );
            totalUpdated += count;
          }
        } else {
          // No records to update for this table.column combination
          logger.info(`No records to update in ${table}.${column}`);
        }
      } catch (error) {
        logger.error(`Error updating ${table}.${column}:`, error);
        cleanup();
        throw error;
      }
    }

    cleanup();
    logger.info(`✅ Completed: Fixed ${totalUpdated} remaining problematic dates`);
    logger.info(`📄 Traceability CSV file saved to: ${CSV_FILE_PATH}`);
  } catch (error) {
    cleanup();
    logger.error("Fatal error in date fix script:", error);
    throw error;
  }
}
