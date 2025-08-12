import { Prisma } from "@prisma/client";
import { prisma } from "@td/prisma";

export async function run() {
  // ========================================
  // CONFIGURATION: Update the cutoff date here
  // ========================================
  // Format: 'YYYY-MM-DDTHH:mm:ss.sssZ' (ISO 8601 format with timezone)
  // Example: '2025-08-12T16:40:00.000Z' for August 12, 2025 at 16:40 UTC
  // 2025-08-11T16:24:00.000+02:00 with timezone
  // Set to null to process all forms (no date filter)
  // after running, mark the migration as applied
  // npx prisma migrate resolve --applied 20250812161124_waste_consistence_1
  const cutoffDate: string | null = null; // Change this date as needed
  // ========================================

  console.log("Starting waste consistence migration script...");

  // Step 1: Check if the column exists, add it if it doesn't
  console.log("Checking if wasteDetailsConsistence_new column exists...");
  let columnExists = false;
  try {
    // Try to query the column to see if it exists
    const result: { column_name: string }[] = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Form' 
      AND column_name = 'wasteDetailsConsistence_new'
    `;
    if (result.length > 0) {
      console.log(
        "Column wasteDetailsConsistence_new already exists, skipping creation."
      );
      columnExists = true;
    } else {
      console.log(
        "Column wasteDetailsConsistence_new doesn't exist, creating it..."
      );
    }
  } catch (_error) {
    // Column doesn't exist, create it
    console.log(
      "Column wasteDetailsConsistence_new doesn't exist, creating it..."
    );
  }
  if (!columnExists) {
    await prisma.$executeRaw`
    ALTER TABLE "Form" ADD COLUMN "wasteDetailsConsistence_new" "Consistence"[]
  `;
    console.log("Column wasteDetailsConsistence_new created successfully.");
  }

  // Step 2: Build the update query with optional date filter
  let whereClause = 'WHERE "wasteDetailsConsistence" IS NOT NULL';
  if (cutoffDate) {
    whereClause += ` AND "updatedAt" >= '${cutoffDate}'::timestamptz`;
    console.log(`Filtering forms updated after: ${cutoffDate}`);
  } else {
    console.log(
      "No date filter applied - processing all forms with wasteDetailsConsistence"
    );
  }

  // Step 4: Migrate existing scalar values to arrays
  console.log("Migrating scalar values to arrays...");

  const updateQuery = `
    UPDATE "Form" 
    SET "wasteDetailsConsistence_new" = ARRAY["wasteDetailsConsistence"]
    ${whereClause}
  `;

  const result = await prisma.$executeRaw`${Prisma.raw(updateQuery)}`;

  console.log(`Successfully updated ${result} forms.`);
  console.log("Waste consistence migration script completed successfully!");
}
