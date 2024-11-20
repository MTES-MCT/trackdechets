import { prisma } from "@td/prisma";
import {
  getFileMetadata,
  getUploadWithWritableStream,
  SSD_HEADERS
} from "@td/registry";
import { Job } from "bull";
import { format } from "date-fns";
import { resetDatabase } from "../../../../integration-tests/helper";
import {
  userFactory,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import {
  processRegistryImportJob,
  RegistryImportJobArgs
} from "../processRegistryImport";

const getCorrectLine = (siret: string) => {
  return {
    reason: "",
    publicId: 1,
    reportAsSiret: "",
    reportForSiret: siret,
    useDate: "2024-02-01",
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
    processingDate: "2024-01-01",
    processingEndDate: "",
    destinationType: "ENTREPRISE_FR",
    destinationOrgId: "78467169500103",
    destinationName: "Nom destination",
    destinationAddress: "Adresse destination",
    destinationCity: "Ville destination",
    destinationPostalCode: "75001",
    destinationCountryCode: "FR",
    operationCode: "R 5",
    qualificationCode: "Recyclage",
    administrativeActReference: "Arrêté du 24 août 2016"
  };
};

describe("Process registry import job", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  describe("processRegistryImportJob", () => {
    it("should fail if the file key isnt valid", async () => {
      expect.assertions(1);

      try {
        await processRegistryImportJob({
          data: { importId: "1", importType: "SSD", s3FileKey: "invalid" }
        } as Job<RegistryImportJobArgs>);
      } catch (err) {
        expect(err.message).toBe('Unknown file "invalid", import "1".');
      }
    });

    it("should fail if the file doesnt have the right MIME type", async () => {
      expect.assertions(1);
      const fileKey = "test-file";

      const { s3Stream, upload } = getUploadWithWritableStream({
        bucketName: process.env.S3_REGISTRY_IMPORTS_BUCKET,
        key: fileKey
      });

      s3Stream.end("test file text");
      await upload.done();

      try {
        await processRegistryImportJob({
          data: { importId: "1", importType: "SSD", s3FileKey: fileKey }
        } as Job<RegistryImportJobArgs>);
      } catch (err) {
        expect(err.message).toBe(
          `Unknown file type for file "${fileKey}", import "1". Received content type "application/octet-stream".`
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
      const { company, user } = await userWithCompanyFactory();

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
      const { company, user } = await userWithCompanyFactory();

      const { s3Stream, upload } = getUploadWithWritableStream({
        bucketName: process.env.S3_REGISTRY_IMPORTS_BUCKET,
        key: fileKey,
        contentType: "text/csv"
      });

      s3Stream.write(Object.values(SSD_HEADERS).join(";") + "\n");
      s3Stream.write(
        Object.values(getCorrectLine(company.orgId)).join(";") + "\n"
      ); // Correct line
      s3Stream.end(";".repeat(Object.values(SSD_HEADERS).length - 1)); // Error line

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
      const { company, user } = await userWithCompanyFactory();

      const { s3Stream, upload } = getUploadWithWritableStream({
        bucketName: process.env.S3_REGISTRY_IMPORTS_BUCKET,
        key: fileKey,
        contentType: "text/csv"
      });

      s3Stream.write(Object.values(SSD_HEADERS).join(";") + "\n");
      s3Stream.write(
        Object.values(getCorrectLine(company.orgId)).join(";") + "\n"
      ); // Correct line
      s3Stream.end(";".repeat(Object.values(SSD_HEADERS).length - 1)); // Error line

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
        `${format(new Date(), "yyyyMMdd")}_TD_rapport_erreur_${
          registryImport.id
        }.csv`
      );

      expect(errorFileMetadata).toBeDefined();
    });

    it("should work if the export has correct lines and lines with missing columns", async () => {
      const fileKey = "missing-column.csv";
      const { company, user } = await userWithCompanyFactory();

      const { s3Stream, upload } = getUploadWithWritableStream({
        bucketName: process.env.S3_REGISTRY_IMPORTS_BUCKET,
        key: fileKey,
        contentType: "text/csv"
      });

      s3Stream.write(Object.values(SSD_HEADERS).join(";") + "\n");
      s3Stream.write(
        Object.values(getCorrectLine(company.orgId)).join(";") + "\n"
      );
      s3Stream.end(";;;;;\n");

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
      const { company } = await userWithCompanyFactory();
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
      const fileKey = "missing-colon.csv";
      const { company } = await userWithCompanyFactory();
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

    it("should fail if the uploaded file is not in a valid format", async () => {
      const fileKey = "invalid-file.csv";
      const { company } = await userWithCompanyFactory();
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
  });
});
