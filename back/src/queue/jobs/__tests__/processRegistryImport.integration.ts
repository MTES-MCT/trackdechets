import { prisma } from "@td/prisma";
import {
  getFileMetadata,
  getUploadWithWritableStream,
  SSD_HEADERS
} from "@td/registry";
import { Job } from "bull";
import { subMonths, format, addDays } from "date-fns";
import { resetDatabase } from "../../../../integration-tests/helper";
import {
  userFactory,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import {
  processRegistryImportJob,
  RegistryImportJobArgs
} from "../processRegistryImport";

const getCorrectLine = (siret: string, reportAsSiret?: string) => {
  const sixMonthsAgo = subMonths(new Date(), 6);
  const processingDate = format(sixMonthsAgo, "yyyy-MM-dd");
  const useDate = format(addDays(sixMonthsAgo, 1), "yyyy-MM-dd");
  const value = {
    reason: "",
    publicId: 1,
    reportAsCompanySiret: reportAsSiret,
    reportForCompanySiret: siret,
    useDate,
    dispatchDate: "",
    wasteCode: "06 07 01*",
    wasteDescription: "Description déchet",
    wasteCodeBale: "",
    secondaryWasteCodes: "",
    secondaryWasteDescriptions: "",
    product: "Produit",
    weightValue: 1.4,
    weightIsEstimate: "REEL",
    volume: 1.2,
    processingDate,
    processingEndDate: "",
    destinationCompanyType: "ETABLISSEMENT_FR",
    destinationCompanyOrgId: "78467169500103",
    destinationCompanyName: "Nom destination",
    destinationCompanyAddress: "Adresse destination",
    destinationCompanyCity: "Ville destination",
    destinationCompanyPostalCode: "75001",
    destinationCompanyCountryCode: "FR",
    operationCode: "R 5",
    operationMode: "RECYCLAGE",
    qualificationCode: "Recyclage",
    administrativeActReference: "Arrêté du 24 août 2016"
  };

  return Object.keys(SSD_HEADERS).reduce((row, key) => {
    row[key] = value[key];
    return row;
  }, {});
};

describe("Process registry import job", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  describe("processRegistryImportJob", () => {
    it("should fail if the file key isnt valid", async () => {
      expect.assertions(1);
      const fileKey = "invalid";
      const user = await userFactory({});
      const registryImport = await prisma.registryImport.create({
        data: {
          s3FileKey: fileKey,
          originalFileName: "no-data.csv",
          type: "SSD",
          status: "PENDING",
          createdById: user.id
        }
      });
      try {
        await processRegistryImportJob({
          data: {
            importId: registryImport.id,
            importType: "SSD",
            s3FileKey: fileKey
          }
        } as Job<RegistryImportJobArgs>);
      } catch (err) {
        expect(err.message).toBe(
          `Unknown file "${fileKey}", import "${registryImport.id}".`
        );
      }
    });

    it("should fail if the file doesnt have the right MIME type", async () => {
      expect.assertions(1);
      const fileKey = "test-file";
      const user = await userFactory({});
      const registryImport = await prisma.registryImport.create({
        data: {
          s3FileKey: fileKey,
          originalFileName: "no-data.csv",
          type: "SSD",
          status: "PENDING",
          createdById: user.id
        }
      });
      const { s3Stream, upload } = getUploadWithWritableStream({
        bucketName: process.env.S3_REGISTRY_IMPORTS_BUCKET,
        key: fileKey
      });

      s3Stream.end("test file text");
      await upload.done();

      try {
        await processRegistryImportJob({
          data: {
            importId: registryImport.id,
            importType: "SSD",
            s3FileKey: fileKey
          }
        } as Job<RegistryImportJobArgs>);
      } catch (err) {
        expect(err.message).toBe(
          `Unknown file type for file "${fileKey}", import "${registryImport.id}". Received content type "application/octet-stream".`
        );
      }
    });

    it("should fail the import when the file has the right headers but no data", async () => {
      const fileKey = "no-data.csv";
      const user = await userFactory({});

      const { s3Stream, upload } = getUploadWithWritableStream({
        bucketName: process.env.S3_REGISTRY_IMPORTS_BUCKET,
        key: fileKey,
        contentType: "text/csv"
      });

      s3Stream.write(Object.values(SSD_HEADERS).join(";") + "\n");
      s3Stream.end();

      await upload.done();

      const registryImport = await prisma.registryImport.create({
        data: {
          s3FileKey: fileKey,
          originalFileName: "no-data.csv",
          type: "SSD",
          status: "PENDING",
          createdById: user.id
        }
      });

      await processRegistryImportJob({
        data: {
          importId: registryImport.id,
          importType: registryImport.type,
          s3FileKey: registryImport.s3FileKey
        }
      } as Job<RegistryImportJobArgs>);

      const result = await prisma.registryImport.findUniqueOrThrow({
        where: { id: registryImport.id }
      });

      expect(result.status).toBe("FAILED");
      expect(result.numberOfInsertions).toBe(0);
      expect(result.numberOfCancellations).toBe(0);
      expect(result.numberOfEdits).toBe(0);
      expect(result.numberOfErrors).toBe(0);
    });

    it("should return correct stats when the SSD file only has insertions", async () => {
      const fileKey = "one-insertion.csv";
      const { company, user } = await userWithCompanyFactory("ADMIN", {
        companyTypes: { set: ["RECOVERY_FACILITY"] }
      });

      const { s3Stream, upload } = getUploadWithWritableStream({
        bucketName: process.env.S3_REGISTRY_IMPORTS_BUCKET,
        key: fileKey,
        contentType: "text/csv"
      });

      s3Stream.write(Object.values(SSD_HEADERS).join(";") + "\n");
      s3Stream.end(
        Object.values(getCorrectLine(company.orgId)).join(";") + "\n"
      );

      await upload.done();

      const registryImport = await prisma.registryImport.create({
        data: {
          s3FileKey: fileKey,
          originalFileName: "one-insertion.csv",
          type: "SSD",
          status: "PENDING",
          createdById: user.id
        }
      });

      await processRegistryImportJob({
        data: {
          importId: registryImport.id,
          importType: registryImport.type,
          s3FileKey: registryImport.s3FileKey
        }
      } as Job<RegistryImportJobArgs>);

      const result = await prisma.registryImport.findUniqueOrThrow({
        where: { id: registryImport.id }
      });

      expect(result.status).toBe("SUCCESSFUL");
      expect(result.numberOfInsertions).toBe(1);
      expect(result.numberOfCancellations).toBe(0);
      expect(result.numberOfEdits).toBe(0);
      expect(result.numberOfErrors).toBe(0);
    });

    it("should return correct stats when the SSD file only has a mix of several actions", async () => {
      const fileKey = "mixed.csv";
      const { company, user } = await userWithCompanyFactory("ADMIN", {
        companyTypes: { set: ["RECOVERY_FACILITY"] }
      });

      const { s3Stream, upload } = getUploadWithWritableStream({
        bucketName: process.env.S3_REGISTRY_IMPORTS_BUCKET,
        key: fileKey,
        contentType: "text/csv"
      });

      s3Stream.write(Object.values(SSD_HEADERS).join(";") + "\n");
      s3Stream.write(
        Object.values(getCorrectLine(company.orgId)).join(";") + "\n"
      ); // Correct line
      s3Stream.end("I'm not a correct line\n"); // Error line

      await upload.done();

      const registryImport = await prisma.registryImport.create({
        data: {
          s3FileKey: fileKey,
          originalFileName: "mixed.csv",
          type: "SSD",
          status: "PENDING",
          createdById: user.id
        }
      });

      await processRegistryImportJob({
        data: {
          importId: registryImport.id,
          importType: registryImport.type,
          s3FileKey: registryImport.s3FileKey
        }
      } as Job<RegistryImportJobArgs>);

      const result = await prisma.registryImport.findUniqueOrThrow({
        where: { id: registryImport.id }
      });

      expect(result.status).toBe("PARTIALLY_SUCCESSFUL");
      expect(result.numberOfInsertions).toBe(1);
      expect(result.numberOfCancellations).toBe(0);
      expect(result.numberOfEdits).toBe(0);
      expect(result.numberOfErrors).toBe(1);
    });

    it("should write an error file with detailed errors when the SSD file contains data errors", async () => {
      const fileKey = "check-errors.csv";
      const { company, user } = await userWithCompanyFactory("ADMIN", {
        companyTypes: { set: ["RECOVERY_FACILITY"] }
      });

      const { s3Stream, upload } = getUploadWithWritableStream({
        bucketName: process.env.S3_REGISTRY_IMPORTS_BUCKET,
        key: fileKey,
        contentType: "text/csv"
      });

      s3Stream.write(Object.values(SSD_HEADERS).join(";") + "\n");
      s3Stream.write(
        Object.values(getCorrectLine(company.orgId)).join(";") + "\n"
      ); // Correct line
      s3Stream.end("I'm not a correct line\n"); // Error line

      await upload.done();

      const registryImport = await prisma.registryImport.create({
        data: {
          s3FileKey: fileKey,
          originalFileName: "check-errors.csv",
          type: "SSD",
          status: "PENDING",
          createdById: user.id
        }
      });

      await processRegistryImportJob({
        data: {
          importId: registryImport.id,
          importType: registryImport.type,
          s3FileKey: registryImport.s3FileKey
        }
      } as Job<RegistryImportJobArgs>);

      const result = await prisma.registryImport.findUniqueOrThrow({
        where: { id: registryImport.id }
      });

      expect(result.status).toBe("PARTIALLY_SUCCESSFUL");

      const errorFileMetadata = await getFileMetadata(
        process.env.S3_REGISTRY_ERRORS_BUCKET,
        registryImport.s3FileKey
      );

      expect(errorFileMetadata).toBeDefined();
    });

    it("should work if the export has correct lines and lines with missing columns", async () => {
      const fileKey = "missing-column.csv";
      const { company, user } = await userWithCompanyFactory("ADMIN", {
        companyTypes: { set: ["RECOVERY_FACILITY"] }
      });

      const { s3Stream, upload } = getUploadWithWritableStream({
        bucketName: process.env.S3_REGISTRY_IMPORTS_BUCKET,
        key: fileKey,
        contentType: "text/csv"
      });

      s3Stream.write(Object.values(SSD_HEADERS).join(";") + "\n");
      s3Stream.write(
        Object.values(getCorrectLine(company.orgId)).join(";") + "\n"
      );
      s3Stream.end("I'm not a correct line\n");

      await upload.done();

      const registryImport = await prisma.registryImport.create({
        data: {
          s3FileKey: fileKey,
          originalFileName: "missing-column.csv",
          type: "SSD",
          status: "PENDING",
          createdById: user.id
        }
      });

      await processRegistryImportJob({
        data: {
          importId: registryImport.id,
          importType: registryImport.type,
          s3FileKey: registryImport.s3FileKey
        }
      } as Job<RegistryImportJobArgs>);

      const result = await prisma.registryImport.findUniqueOrThrow({
        where: { id: registryImport.id }
      });

      expect(result.status).toBe("PARTIALLY_SUCCESSFUL");
      expect(result.numberOfInsertions).toBe(1);
      expect(result.numberOfCancellations).toBe(0);
      expect(result.numberOfEdits).toBe(0);
      expect(result.numberOfErrors).toBe(1);
    });

    it("should fail if the current user doesnt have the rights on the reportFor siret", async () => {
      const fileKey = "missing-colon.csv";
      const { company } = await userWithCompanyFactory("ADMIN", {
        companyTypes: { set: ["RECOVERY_FACILITY"] }
      });
      const { user } = await userWithCompanyFactory();

      const { s3Stream, upload } = getUploadWithWritableStream({
        bucketName: process.env.S3_REGISTRY_IMPORTS_BUCKET,
        key: fileKey,
        contentType: "text/csv"
      });

      s3Stream.write(Object.values(SSD_HEADERS).join(";") + "\n");
      s3Stream.end(
        Object.values(getCorrectLine(company.orgId)).join(";") + "\n"
      );

      await upload.done();

      const registryImport = await prisma.registryImport.create({
        data: {
          s3FileKey: fileKey,
          originalFileName: "missing-column.csv",
          type: "SSD",
          status: "PENDING",
          createdById: user.id
        }
      });

      await processRegistryImportJob({
        data: {
          importId: registryImport.id,
          importType: registryImport.type,
          s3FileKey: registryImport.s3FileKey
        }
      } as Job<RegistryImportJobArgs>);

      const result = await prisma.registryImport.findUniqueOrThrow({
        where: { id: registryImport.id }
      });

      expect(result.status).toBe("FAILED");
      expect(result.numberOfInsertions).toBe(0);
      expect(result.numberOfCancellations).toBe(0);
      expect(result.numberOfEdits).toBe(0);
      expect(result.numberOfErrors).toBe(1);
    });

    it("should work if the current user has delegation rights on the reportFor siret", async () => {
      const fileKey = "delegation.csv";
      const { company } = await userWithCompanyFactory("ADMIN", {
        companyTypes: { set: ["RECOVERY_FACILITY"] }
      });
      const { user, company: delegateCompany } = await userWithCompanyFactory();

      await prisma.registryDelegation.create({
        data: {
          startDate: new Date(),
          delegateId: delegateCompany.id,
          delegatorId: company.id
        }
      });

      const { s3Stream, upload } = getUploadWithWritableStream({
        bucketName: process.env.S3_REGISTRY_IMPORTS_BUCKET,
        key: fileKey,
        contentType: "text/csv"
      });

      s3Stream.write(Object.values(SSD_HEADERS).join(";") + "\n");
      s3Stream.end(
        Object.values(
          getCorrectLine(company.orgId, delegateCompany.orgId)
        ).join(";") + "\n"
      );

      await upload.done();

      const registryImport = await prisma.registryImport.create({
        data: {
          s3FileKey: fileKey,
          originalFileName: fileKey,
          type: "SSD",
          status: "PENDING",
          createdById: user.id
        }
      });

      await processRegistryImportJob({
        data: {
          importId: registryImport.id,
          importType: registryImport.type,
          s3FileKey: registryImport.s3FileKey
        }
      } as Job<RegistryImportJobArgs>);

      const result = await prisma.registryImport.findUniqueOrThrow({
        where: { id: registryImport.id }
      });

      expect(result.status).toBe("SUCCESSFUL");
      expect(result.numberOfInsertions).toBe(1);
      expect(result.numberOfCancellations).toBe(0);
      expect(result.numberOfEdits).toBe(0);
      expect(result.numberOfErrors).toBe(0);
    });

    it("should fail if the uploaded file is not in a valid format", async () => {
      const fileKey = "invalid-file.csv";
      const { company } = await userWithCompanyFactory("ADMIN", {
        companyTypes: { set: ["RECOVERY_FACILITY"] }
      });
      const { user, company: delegationCompany } =
        await userWithCompanyFactory();

      await prisma.registryDelegation.create({
        data: {
          startDate: new Date(),
          delegateId: delegationCompany.id,
          delegatorId: company.id
        }
      });

      const { s3Stream, upload } = getUploadWithWritableStream({
        bucketName: process.env.S3_REGISTRY_IMPORTS_BUCKET,
        key: fileKey,
        contentType: "text/csv"
      });

      s3Stream.write("PK");
      s3Stream.end("");

      await upload.done();

      const registryImport = await prisma.registryImport.create({
        data: {
          s3FileKey: fileKey,
          originalFileName: "missing-column.csv",
          type: "SSD",
          status: "PENDING",
          createdById: user.id
        }
      });

      await processRegistryImportJob({
        data: {
          importId: registryImport.id,
          importType: registryImport.type,
          s3FileKey: registryImport.s3FileKey
        }
      } as Job<RegistryImportJobArgs>);

      const result = await prisma.registryImport.findUniqueOrThrow({
        where: { id: registryImport.id }
      });

      expect(result.status).toBe("FAILED");
      expect(result.numberOfInsertions).toBe(0);
      expect(result.numberOfCancellations).toBe(0);
      expect(result.numberOfEdits).toBe(0);
      expect(result.numberOfErrors).toBe(1);
    });

    it("should ignore the first column if its called Erreur", async () => {
      const fileKey = "one-insertion-with-error.csv";
      const { company, user } = await userWithCompanyFactory("ADMIN", {
        companyTypes: { set: ["RECOVERY_FACILITY"] }
      });

      const { s3Stream, upload } = getUploadWithWritableStream({
        bucketName: process.env.S3_REGISTRY_IMPORTS_BUCKET,
        key: fileKey,
        contentType: "text/csv"
      });

      s3Stream.write(
        ["Erreur", ...Object.values(SSD_HEADERS)].join(";") + "\n"
      );
      s3Stream.end(
        ["Une erreur", ...Object.values(getCorrectLine(company.orgId))].join(
          ";"
        ) + "\n"
      );

      await upload.done();

      const registryImport = await prisma.registryImport.create({
        data: {
          s3FileKey: fileKey,
          originalFileName: "one-insertion-with-error.csv",
          type: "SSD",
          status: "PENDING",
          createdById: user.id
        }
      });

      await processRegistryImportJob({
        data: {
          importId: registryImport.id,
          importType: registryImport.type,
          s3FileKey: registryImport.s3FileKey
        }
      } as Job<RegistryImportJobArgs>);

      const result = await prisma.registryImport.findUniqueOrThrow({
        where: { id: registryImport.id }
      });

      expect(result.status).toBe("SUCCESSFUL");
      expect(result.numberOfInsertions).toBe(1);
      expect(result.numberOfCancellations).toBe(0);
      expect(result.numberOfEdits).toBe(0);
      expect(result.numberOfErrors).toBe(0);
    });

    it("should ignore empty lines", async () => {
      const fileKey = "one-insertion-with-empty-lines.csv";
      const { company, user } = await userWithCompanyFactory("ADMIN", {
        companyTypes: { set: ["RECOVERY_FACILITY"] }
      });

      const { s3Stream, upload } = getUploadWithWritableStream({
        bucketName: process.env.S3_REGISTRY_IMPORTS_BUCKET,
        key: fileKey,
        contentType: "text/csv"
      });

      s3Stream.write(Object.values(SSD_HEADERS).join(";") + "\n");
      s3Stream.write(";".repeat(Object.values(SSD_HEADERS).length - 1) + "\n");
      s3Stream.write(
        Object.values(getCorrectLine(company.orgId)).join(";") + "\n"
      );
      s3Stream.end(";".repeat(Object.values(SSD_HEADERS).length - 1) + "\n");

      await upload.done();

      const registryImport = await prisma.registryImport.create({
        data: {
          s3FileKey: fileKey,
          originalFileName: "one-insertion-with-empty-lines.csv",
          type: "SSD",
          status: "PENDING",
          createdById: user.id
        }
      });

      await processRegistryImportJob({
        data: {
          importId: registryImport.id,
          importType: registryImport.type,
          s3FileKey: registryImport.s3FileKey
        }
      } as Job<RegistryImportJobArgs>);

      const result = await prisma.registryImport.findUniqueOrThrow({
        where: { id: registryImport.id }
      });

      expect(result.status).toBe("SUCCESSFUL");
      expect(result.numberOfInsertions).toBe(1);
      expect(result.numberOfCancellations).toBe(0);
      expect(result.numberOfEdits).toBe(0);
      expect(result.numberOfErrors).toBe(0);
    });

    it("should work with clear errors when an import is made with several lines containing the same publicId", async () => {
      // Those indexes are not part of the Prisma schema, so we need to create them manually
      // Because Prisma doesnt have support for partial indexes yet
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS
        "_RegistrySsdPublicIdReportForSiretIsLatestUIdx" ON "default$default"."RegistrySsd"("publicId", "reportForCompanySiret")
        WHERE "isLatest"=TRUE;
      `);

      const fileKey = "mixed.csv";
      const { company, user } = await userWithCompanyFactory("ADMIN", {
        companyTypes: { set: ["RECOVERY_FACILITY"] }
      });

      const { s3Stream, upload } = getUploadWithWritableStream({
        bucketName: process.env.S3_REGISTRY_IMPORTS_BUCKET,
        key: fileKey,
        contentType: "text/csv"
      });

      const line = getCorrectLine(company.orgId);

      s3Stream.write(Object.values(SSD_HEADERS).join(";") + "\n");

      // 5 lines with the same publicId
      s3Stream.write(Object.values(line).join(";") + "\n");
      s3Stream.write(Object.values(line).join(";") + "\n");
      s3Stream.write(Object.values(line).join(";") + "\n");
      s3Stream.write(Object.values(line).join(";") + "\n");
      s3Stream.end(Object.values(line).join(";"));

      await upload.done();

      const registryImport = await prisma.registryImport.create({
        data: {
          s3FileKey: fileKey,
          originalFileName: "mixed.csv",
          type: "SSD",
          status: "PENDING",
          createdById: user.id
        }
      });

      await processRegistryImportJob({
        data: {
          importId: registryImport.id,
          importType: registryImport.type,
          s3FileKey: registryImport.s3FileKey
        }
      } as Job<RegistryImportJobArgs>);

      const result = await prisma.registryImport.findUniqueOrThrow({
        where: { id: registryImport.id }
      });

      expect(result.status).toBe("PARTIALLY_SUCCESSFUL");
      expect(result.numberOfInsertions).toBe(1);
      expect(result.numberOfCancellations).toBe(0);
      expect(result.numberOfEdits).toBe(0);
      expect(result.numberOfErrors).toBe(4);
    });
  });
});
