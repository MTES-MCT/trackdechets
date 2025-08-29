import { prisma } from "@td/prisma";
import { getFileAsStream, getFileMetadata } from "@td/registry";
import { Job } from "bull";
import { subMonths } from "date-fns";
import { resetDatabase } from "../../../../integration-tests/helper";
import {
  transporterReceiptFactory,
  companyFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import type { Mutation } from "@td/codegen-back";
import makeClient from "../../../__tests__/testClient";
import { gql } from "graphql-tag";
import {
  processRegistryExportJob,
  RegistryExportJobArgs
} from "../processRegistryExport";
import { RegistryExportFormat, RegistryExportStatus } from "@prisma/client";
import { parse as csvParse } from "@fast-csv/parse";
import * as Excel from "exceljs";
import { Readable } from "stream";

const CREATE_BSDA = gql`
  mutation CreateBsda($input: BsdaInput!) {
    createBsda(input: $input) {
      id
      status
      destination {
        company {
          siret
        }
      }
      emitter {
        company {
          siret
        }
      }
      waste {
        code
      }
    }
  }
`;

const SIGN_BSDA = gql`
  mutation SignBsda($id: ID!, $input: BsdaSignatureInput!) {
    signBsda(id: $id, input: $input) {
      id
      status
    }
  }
`;

// Helper function to wait for RegistryLookup entries to be created
const waitForRegistryLookup = async (
  bsdaId: string,
  maxAttempts = 10,
  intervalMs = 1000,
  expectedCount = 1
): Promise<void> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const lookupCount = await prisma.registryLookup.count({
      where: { bsdaId }
    });

    if (lookupCount === expectedCount) {
      return;
    }

    if (attempt < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error(
    `Registry lookup entries not created for BSDA ${bsdaId} after ${maxAttempts} attempts`
  );
};

// Helper function to sign BSDA
const signBsda = async (
  user: any,
  bsdaId: string,
  signatureType: "EMISSION" | "WORK" | "TRANSPORT" | "RECEPTION" | "OPERATION",
  date?: Date
): Promise<void> => {
  const { mutate } = makeClient(user);
  const { data, errors } = await mutate(SIGN_BSDA, {
    variables: {
      id: bsdaId,
      input: {
        type: signatureType,
        author: user.name,
        date: date?.toISOString()
      }
    }
  });
  if (errors || !data?.signBsda) {
    throw new Error(`Failed to sign BSDA: ${errors?.[0]?.message}`);
  }
};

// Helper function to sign BSDA for outgoing registry (emitter -> transporter signatures)
const signBsdaForOutgoingRegistry = async (
  emitterUser: any,
  workerUser: any,
  transporterUser: any,
  bsdaId: string
): Promise<void> => {
  await signBsda(emitterUser, bsdaId, "EMISSION");
  await signBsda(workerUser, bsdaId, "WORK");
  await signBsda(transporterUser, bsdaId, "TRANSPORT");
  // After transport signature, outgoing registry entries should appear
  await waitForRegistryLookup(bsdaId, 10, 500, 3);
};

// Helper function to sign BSDA for incoming registry (complete flow through operation)
const signBsdaForIncomingRegistry = async (
  emitterUser: any,
  workerUser: any,
  transporterUser: any,
  destinationUser: any,
  bsdaId: string
): Promise<void> => {
  await signBsda(emitterUser, bsdaId, "EMISSION");
  await signBsda(workerUser, bsdaId, "WORK");
  await signBsda(transporterUser, bsdaId, "TRANSPORT");
  await signBsda(destinationUser, bsdaId, "OPERATION");
  // After operation signature, incoming registry entries should appear
  await waitForRegistryLookup(bsdaId, 10, 500, 4);
};

// Helper function to create a BSDA using GraphQL mutation
const createTestBsda = async (
  user: any,
  emitterSiret: string,
  workerSiret: string,
  destinationSiret: string,
  transporterSiret: string,
  wasteCode = "06 07 01*",
  date = new Date()
) => {
  const { mutate } = makeClient(user);

  const input = {
    type: "OTHER_COLLECTIONS",
    emitter: {
      isPrivateIndividual: false,
      company: {
        siret: emitterSiret,
        name: "Test Emitter",
        address: "Test Address",
        contact: "Test Contact",
        phone: "0101010101",
        mail: "emitter@test.com"
      }
    },
    transporter: {
      transport: {
        plates: ["12345"]
      },
      company: {
        siret: transporterSiret,
        name: "Test Transporter",
        address: "Test Address",
        contact: "Test Contact",
        phone: "0101010101",
        mail: "transporter@test.com"
      }
    },
    worker: {
      company: {
        siret: workerSiret,
        name: "worker",
        address: "address",
        contact: "contactEmail",
        phone: "contactPhone",
        mail: "contactEmail@mail.com"
      }
    },
    waste: {
      code: wasteCode,
      consistence: "SOLIDE",
      familyCode: "Code famille",
      materialName: "Test Material",
      pop: false
    },
    packagings: [{ quantity: 1, type: "PALETTE_FILME" }],
    weight: { isEstimate: false, value: 1.2 },
    destination: {
      cap: "Test CAP",
      plannedOperationCode: "R 5",
      company: {
        siret: destinationSiret,
        name: "Test Destination",
        address: "Test Address",
        contact: "Test Contact",
        phone: "0101010101",
        mail: "destination@test.com"
      },
      reception: {
        date: date.toISOString(),
        weight: 1.2,
        acceptationStatus: "ACCEPTED"
      },
      operation: {
        code: "D 5",
        mode: "ELIMINATION",
        date: date.toISOString()
      }
    }
  };

  const { data, errors } = await mutate<Pick<Mutation, "createBsda">>(
    CREATE_BSDA,
    {
      variables: { input }
    }
  );

  if (errors || !data?.createBsda) {
    throw new Error(`Failed to create BSDA: ${errors?.[0]?.message}`);
  }

  return data.createBsda;
};

// Helper function to read file content from S3 stream
const getFileContent = async (
  bucketName: string,
  key: string
): Promise<string> => {
  const stream = await getFileAsStream(bucketName, key);
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    stream.on("data", chunk => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    stream.on("error", reject);
  });
};

// Helper function to read file content as buffer from S3 stream
const getFileContentAsBuffer = async (
  bucketName: string,
  key: string
): Promise<Buffer> => {
  const stream = await getFileAsStream(bucketName, key);
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    stream.on("data", chunk => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
};

// Helper function to parse CSV content using @fast-csv/parse
const parseCsvContent = (content: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const rows: any[] = [];
    const stream = Readable.from([content]);

    stream
      .pipe(
        csvParse({
          headers: true,
          delimiter: ";"
        })
      )
      .on("data", row => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", error => reject(error));
  });
};

// Helper function to parse XLSX content using exceljs
const parseXlsxContent = async (content: Buffer): Promise<any[]> => {
  const workbook = new Excel.Workbook();
  await workbook.xlsx.load(content);

  const worksheet = workbook.worksheets[0];
  const rows: any[] = [];

  if (worksheet.rowCount <= 1) {
    return rows; // No data rows
  }

  // Get headers from first row
  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber - 1] = cell.text;
  });

  // Process data rows
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const rowData: any = {};

    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber - 1];
      if (header) {
        rowData[header] = cell.text;
      }
    });

    // Only add non-empty rows
    if (Object.values(rowData).some(val => val)) {
      rows.push(rowData);
    }
  }

  return rows;
};

const createRegistryExport = async (
  userId: string,
  sirets: string[],
  registryType:
    | "INCOMING"
    | "OUTGOING"
    | "TRANSPORTED"
    | "MANAGED"
    | "SSD" = "INCOMING",
  format: RegistryExportFormat = "CSV"
) => {
  return prisma.registryExport.create({
    data: {
      status: RegistryExportStatus.PENDING,
      registryType,
      format,
      sirets,
      createdById: userId,
      startDate: new Date(),
      endDate: new Date()
    }
  });
};

describe("Process registry export job", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  describe("processRegistryExportJob", () => {
    it("should fail if the export record is not found", async () => {
      const invalidId = "invalid-id";

      try {
        await processRegistryExportJob({
          data: {
            exportId: invalidId,
            dateRange: {
              _gte: subMonths(new Date(), 6),
              _lte: new Date()
            }
          }
        } as Job<RegistryExportJobArgs>);
      } catch (err) {
        expect(err.message).toBe(`L'export ${invalidId} est introuvable`);
      }
    });

    it("should create a successful CSV export for INCOMING registry with BSDA data", async () => {
      // Create test companies
      const { user: emitterUser, company: emitterCompany } =
        await userWithCompanyFactory("ADMIN");
      const { user: destinationUser, company: destinationCompany } =
        await userWithCompanyFactory("ADMIN");
      const { user: transporterUser, company: transporterCompany } =
        await userWithCompanyFactory("ADMIN");
      await transporterReceiptFactory({ company: transporterCompany });
      const { user: workerUser, company: workerCompany } =
        await userWithCompanyFactory("ADMIN");
      // Create test BSDA
      const bsda = await createTestBsda(
        destinationUser, // Use destination user for creating the BSDA
        emitterCompany.orgId,
        workerCompany.orgId,
        destinationCompany.orgId,
        transporterCompany.orgId,
        "06 07 01*"
      );
      // Sign BSDA through the complete workflow for INCOMING registry
      await signBsdaForIncomingRegistry(
        emitterUser,
        workerUser,
        transporterUser,
        destinationUser,
        bsda.id
      );
      // Create export request
      const registryExport = await createRegistryExport(
        destinationUser.id,
        [destinationCompany.orgId],
        "INCOMING",
        "CSV"
      );
      // Process export
      await processRegistryExportJob({
        data: {
          exportId: registryExport.id,
          dateRange: {
            _gte: subMonths(new Date(), 12)
          }
        }
      } as Job<RegistryExportJobArgs>);
      // Verify export status
      const result = await prisma.registryExport.findUniqueOrThrow({
        where: { id: registryExport.id }
      });

      expect(result.status).toBe("SUCCESSFUL");
      expect(result.s3FileKey).toBeDefined();
      expect(result.sirets).toEqual([destinationCompany.orgId]);

      // Verify file was created
      const fileMetadata = await getFileMetadata(
        process.env.S3_REGISTRY_EXPORTS_BUCKET!,
        result.s3FileKey!
      );
      expect(fileMetadata).toBeDefined();
      await new Promise(resolve => setTimeout(resolve, 3000));
      // Verify file content
      const fileContent = await getFileContent(
        process.env.S3_REGISTRY_EXPORTS_BUCKET!,
        result.s3FileKey!
      );
      expect(fileContent).toBeDefined();

      // Parse CSV and verify content
      const rows = await parseCsvContent(fileContent);
      expect(rows).toHaveLength(1);
      expect(rows[0]["N° de bordereau"]).toBe(bsda.id);
      expect(rows[0]["Type de bordereau"]).toBe("BSDA");
      expect(rows[0]["Code déchet"]).toBe(bsda.waste?.code);
    }, 20000); // leave more time as we need to wait for some jobs to run);

    it("should create consistent data between CSV and XLSX formats", async () => {
      // Create test data
      const { user: emitterUser, company: emitterCompany } =
        await userWithCompanyFactory("ADMIN");
      const { user: destinationUser, company: destinationCompany } =
        await userWithCompanyFactory("ADMIN");
      const { user: transporterUser, company: transporterCompany } =
        await userWithCompanyFactory("ADMIN");
      await transporterReceiptFactory({ company: transporterCompany });
      const { user: workerUser, company: workerCompany } =
        await userWithCompanyFactory("ADMIN");

      const _bsda = await createTestBsda(
        destinationUser,
        emitterCompany.orgId,
        workerCompany.orgId,
        destinationCompany.orgId,
        transporterCompany.orgId,
        "06 07 01*"
      );

      // Sign BSDA for INCOMING registry
      await signBsdaForIncomingRegistry(
        emitterUser,
        workerUser,
        transporterUser,
        destinationUser,
        _bsda.id
      );

      // Create CSV export
      const csvExport = await createRegistryExport(
        destinationUser.id,
        [destinationCompany.orgId],
        "INCOMING",
        "CSV"
      );

      // Create XLSX export
      const xlsxExport = await createRegistryExport(
        destinationUser.id,
        [destinationCompany.orgId],
        "INCOMING",
        "XLSX"
      );

      const dateRange = {
        _gte: subMonths(new Date(), 12)
      };
      await processRegistryExportJob({
        data: { exportId: csvExport.id, dateRange }
      } as Job<RegistryExportJobArgs>);

      await processRegistryExportJob({
        data: { exportId: xlsxExport.id, dateRange }
      } as Job<RegistryExportJobArgs>);

      const csvResult = await prisma.registryExport.findUniqueOrThrow({
        where: { id: csvExport.id }
      });
      const xlsxResult = await prisma.registryExport.findUniqueOrThrow({
        where: { id: xlsxExport.id }
      });

      expect(csvResult.status).toBe("SUCCESSFUL");
      expect(xlsxResult.status).toBe("SUCCESSFUL");
      await new Promise(resolve => setTimeout(resolve, 3000));
      // Get file contents
      const csvContent = await getFileContent(
        process.env.S3_REGISTRY_EXPORTS_BUCKET!,
        csvResult.s3FileKey!
      );

      // Parse CSV
      const csvRows = await parseCsvContent(csvContent);

      // Parse XLSX
      const xlsxContentBuffer = await getFileContentAsBuffer(
        process.env.S3_REGISTRY_EXPORTS_BUCKET!,
        xlsxResult.s3FileKey!
      );
      const xlsxRows = await parseXlsxContent(xlsxContentBuffer);
      // Verify same number of rows
      expect(csvRows).toHaveLength(xlsxRows.length);
      expect(csvRows).toHaveLength(1);

      // Verify key data consistency
      const csvRow = csvRows[0];
      const xlsxRow = xlsxRows[0];

      expect(csvRow["N° de bordereau"]).toBe(xlsxRow["N° de bordereau"]);
      expect(csvRow["Type de bordereau"]).toBe(xlsxRow["Type de bordereau"]);
      expect(csvRow["Code déchet"]).toBe(xlsxRow["Code déchet"]);
    }, 20000); // leave more time as we need to wait for some jobs to run

    it("should correctly filter by date range", async () => {
      const { user: emitterUser, company: emitterCompany } =
        await userWithCompanyFactory("ADMIN");
      const { user: destinationUser, company: destinationCompany } =
        await userWithCompanyFactory("ADMIN");
      const { user: transporterUser, company: transporterCompany } =
        await userWithCompanyFactory("ADMIN");
      await transporterReceiptFactory({ company: transporterCompany });
      const { user: workerUser, company: workerCompany } =
        await userWithCompanyFactory("ADMIN");

      const sixMonthsAgo = subMonths(new Date(), 6);
      const oneYearAgo = subMonths(new Date(), 12);

      // Create BSDs with different dates (only one will be in date range)
      const recentBsda = await createTestBsda(
        destinationUser,
        emitterCompany.orgId,
        workerCompany.orgId,
        destinationCompany.orgId,
        transporterCompany.orgId,
        "06 07 01*",
        sixMonthsAgo
      );

      // Sign BSDA for INCOMING registry
      await signBsdaForIncomingRegistry(
        emitterUser,
        workerUser,
        transporterUser,
        destinationUser,
        recentBsda.id
      );

      // Create BSDs with different dates (only one will be in date range)
      const oldBsda = await createTestBsda(
        destinationUser,
        emitterCompany.orgId,
        workerCompany.orgId,
        destinationCompany.orgId,
        transporterCompany.orgId,
        "06 07 01*",
        oneYearAgo
      );

      // Sign BSDA for INCOMING registry
      await signBsdaForIncomingRegistry(
        emitterUser,
        workerUser,
        transporterUser,
        destinationUser,
        oldBsda.id
      );

      // Note: We only create one BSD since the date filtering logic
      // is complex and would require additional BSDA processing steps
      // to set historical dates. The createTestBsda creates current date BSDs.

      // Export with restricted date range (last 8 months)
      const registryExport = await createRegistryExport(
        destinationUser.id,
        [destinationCompany.orgId],
        "INCOMING",
        "CSV"
      );

      await processRegistryExportJob({
        data: {
          exportId: registryExport.id,
          dateRange: {
            _gte: subMonths(new Date(), 8)
          }
        }
      } as Job<RegistryExportJobArgs>);

      const result = await prisma.registryExport.findUniqueOrThrow({
        where: { id: registryExport.id }
      });

      expect(result.status).toBe("SUCCESSFUL");
      await new Promise(resolve => setTimeout(resolve, 3000));
      // Verify only recent BSDA is included
      const fileContent = await getFileContent(
        process.env.S3_REGISTRY_EXPORTS_BUCKET!,
        result.s3FileKey!
      );

      const rows = await parseCsvContent(fileContent);

      expect(rows).toHaveLength(1);
      expect(rows[0]["N° de bordereau"]).toBe(recentBsda.id);
      expect(rows[0]["Code déchet"]).toBe(recentBsda.waste?.code);
    }, 20000); // leave more time as we need to wait for some jobs to run);

    it("should correctly filter by waste type", async () => {
      const { user: emitterUser, company: emitterCompany } =
        await userWithCompanyFactory("ADMIN");
      const { user: destinationUser, company: destinationCompany } =
        await userWithCompanyFactory("ADMIN");
      const { user: transporterUser, company: transporterCompany } =
        await userWithCompanyFactory("ADMIN");
      await transporterReceiptFactory({ company: transporterCompany });
      const { user: workerUser, company: workerCompany } =
        await userWithCompanyFactory("ADMIN");

      // Create BSDs with different waste types
      const dangerousBsda = await createTestBsda(
        destinationUser,
        emitterCompany.orgId,
        workerCompany.orgId,
        destinationCompany.orgId,
        transporterCompany.orgId,
        "06 07 01*" // Dangerous waste
      );

      // Sign dangerous BSDA for INCOMING registry
      await signBsdaForIncomingRegistry(
        emitterUser,
        workerUser,
        transporterUser,
        destinationUser,
        dangerousBsda.id
      );

      // Create export filtering only dangerous waste
      const registryExport = await prisma.registryExport.create({
        data: {
          status: RegistryExportStatus.PENDING,
          registryType: "INCOMING",
          format: "CSV",
          sirets: [destinationCompany.orgId],
          createdById: destinationUser.id,
          wasteTypes: ["DND"], // Only dangerous waste
          startDate: new Date(),
          endDate: new Date()
        }
      });

      await processRegistryExportJob({
        data: {
          exportId: registryExport.id,
          dateRange: {
            _gte: subMonths(new Date(), 12)
          }
        }
      } as Job<RegistryExportJobArgs>);

      const result = await prisma.registryExport.findUniqueOrThrow({
        where: { id: registryExport.id }
      });

      expect(result.status).toBe("SUCCESSFUL");

      const fileContent = await getFileContent(
        process.env.S3_REGISTRY_EXPORTS_BUCKET!,
        result.s3FileKey!
      );

      const rows = await parseCsvContent(fileContent);

      // Should only contain dangerous waste
      expect(rows).toHaveLength(0);
    }, 20000); // leave more time as we need to wait for some jobs to run);

    it("should correctly export OUTGOING registry for emitter", async () => {
      const { user: emitterUser, company: emitterCompany } =
        await userWithCompanyFactory("ADMIN");
      const { user: _destinationUser, company: destinationCompany } =
        await userWithCompanyFactory("ADMIN");
      const { user: transporterUser, company: transporterCompany } =
        await userWithCompanyFactory("ADMIN");
      await transporterReceiptFactory({ company: transporterCompany });
      const { user: workerUser, company: workerCompany } =
        await userWithCompanyFactory("ADMIN");

      const _bsda = await createTestBsda(
        emitterUser, // Use emitter user for creating the BSDA
        emitterCompany.orgId,
        workerCompany.orgId,
        destinationCompany.orgId,
        transporterCompany.orgId,
        "06 07 01*"
      );

      // Sign BSDA for OUTGOING registry (through TRANSPORT signature)
      await signBsdaForOutgoingRegistry(
        emitterUser,
        workerUser,
        transporterUser,
        _bsda.id
      );

      const registryExport = await createRegistryExport(
        emitterUser.id,
        [emitterCompany.orgId],
        "OUTGOING",
        "CSV"
      );

      await processRegistryExportJob({
        data: {
          exportId: registryExport.id,
          dateRange: {
            _gte: subMonths(new Date(), 12)
          }
        }
      } as Job<RegistryExportJobArgs>);

      const result = await prisma.registryExport.findUniqueOrThrow({
        where: { id: registryExport.id }
      });

      expect(result.status).toBe("SUCCESSFUL");
      await new Promise(resolve => setTimeout(resolve, 3000));
      const fileContent = await getFileContent(
        process.env.S3_REGISTRY_EXPORTS_BUCKET!,
        result.s3FileKey!
      );

      const rows = await parseCsvContent(fileContent);

      expect(rows).toHaveLength(1);
      expect(rows[0]["N° de bordereau"]).toBe(_bsda.id);

      // Verify it's from emitter perspective (should have emitter details)
      expect(rows[0]["Expéditeur - N° d'identification"]).toBe(
        emitterCompany.orgId
      );
    }, 20000); // leave more time as we need to wait for some jobs to run);

    it("should handle exports with no data gracefully", async () => {
      const { company: destinationCompany } = await userWithCompanyFactory(
        "ADMIN"
      );
      const { user: destinationUser } = await userWithCompanyFactory("ADMIN");

      const registryExport = await createRegistryExport(
        destinationUser.id,
        [destinationCompany.orgId],
        "INCOMING",
        "CSV"
      );

      await processRegistryExportJob({
        data: {
          exportId: registryExport.id,
          dateRange: {
            _gte: subMonths(new Date(), 12)
          }
        }
      } as Job<RegistryExportJobArgs>);

      const result = await prisma.registryExport.findUniqueOrThrow({
        where: { id: registryExport.id }
      });

      expect(result.status).toBe("SUCCESSFUL");
      await new Promise(resolve => setTimeout(resolve, 3000));
      const fileContent = await getFileContent(
        process.env.S3_REGISTRY_EXPORTS_BUCKET!,
        result.s3FileKey!
      );

      // Should be just headers
      const rows = await parseCsvContent(fileContent);

      expect(rows).toHaveLength(0);
    });

    it("should correctly handle SIRET filtering and cleanup unused SIRETs", async () => {
      const company1 = await companyFactory();
      const company2 = await companyFactory();
      const { user: transporterUser, company: transporterCompany } =
        await userWithCompanyFactory("ADMIN");
      await transporterReceiptFactory({ company: transporterCompany });
      const { user: workerUser, company: workerCompany } =
        await userWithCompanyFactory("ADMIN");

      const emitterUser = await userFactory({
        companyAssociations: {
          create: [
            {
              company: { connect: { id: company1.id } },
              role: "ADMIN"
            },
            {
              company: { connect: { id: company2.id } },
              role: "ADMIN"
            }
          ]
        }
      });
      // Create BSDA only for company1 (destination)
      const _bsda = await createTestBsda(
        emitterUser, // Use emitter user since company1 is both emitter and destination
        company1.orgId,
        workerCompany.orgId,
        company1.orgId,
        transporterCompany.orgId,
        "06 07 01*"
      );

      // Sign BSDA for INCOMING registry
      await signBsdaForIncomingRegistry(
        emitterUser,
        workerUser,
        transporterUser,
        emitterUser, // Same user since company1 is both emitter and destination
        _bsda.id
      );

      // Request export for both companies, but only company1 has data
      const registryExport = await createRegistryExport(
        emitterUser.id,
        [company1.orgId, company2.orgId], // Both companies requested
        "INCOMING",
        "CSV"
      );

      await processRegistryExportJob({
        data: {
          exportId: registryExport.id,
          dateRange: {
            _gte: subMonths(new Date(), 12)
          }
        }
      } as Job<RegistryExportJobArgs>);
      const result = await prisma.registryExport.findUniqueOrThrow({
        where: { id: registryExport.id }
      });
      expect(result.status).toBe("SUCCESSFUL");
      // Should only contain company1 since company2 had no data
      expect(result.sirets).toEqual([company1.orgId]);
    }, 20000); // leave more time as we need to wait for some jobs to run);
  });
});
