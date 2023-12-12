import * as Excel from "exceljs";
import fs, { createWriteStream } from "fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import {
  refreshElasticSearch,
  resetDatabase
} from "../../../../../integration-tests/helper";
import supertest from "supertest";
import { ErrorCode } from "../../../../common/errors";
import { app } from "../../../../server";
import {
  companyFactory,
  formFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { Query } from "../../../../generated/graphql/types";
import { WASTES_REGISTRY_XLS } from "./queries";
import { getFormForElastic, indexForm } from "../../../../forms/elastic";
import { getBsdaForElastic, indexBsda } from "../../../../bsda/elastic";
import { bsdaFactory } from "../../../../bsda/__tests__/factories";
import {
  emptyIncomingWaste,
  emptyOutgoingWaste,
  emptyTransportedWaste
} from "../../../types";
import { columns } from "../../../columns";

function emitterFormFactory(ownerId: string, siret: string) {
  return formFactory({
    ownerId,
    opt: {
      emitterCompanySiret: siret,
      status: "PROCESSED",
      sentAt: new Date(),
      receivedAt: new Date()
    }
  });
}

function recipientFormFactory(ownerId: string, siret: string) {
  return formFactory({
    ownerId,
    opt: {
      recipientCompanySiret: siret,
      status: "PROCESSED",
      sentAt: new Date(),
      receivedAt: new Date()
    }
  });
}

function transporterFormFactory(ownerId: string, siret: string) {
  return formFactory({
    ownerId,
    opt: {
      status: "PROCESSED",
      sentAt: new Date(),
      receivedAt: new Date(),
      transporters: {
        create: {
          transporterCompanySiret: siret,
          number: 1
        }
      }
    }
  });
}

function traderFormFactory(ownerId: string, siret: string) {
  return formFactory({
    ownerId,
    opt: {
      traderCompanySiret: siret,
      status: "PROCESSED",
      sentAt: new Date(),
      receivedAt: new Date()
    }
  });
}

describe("query { wastesRegistryXls }", () => {
  afterEach(resetDatabase);

  it("should throw exception if registry is empty", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { query } = makeClient(user);
    const { errors } = await query<Pick<Query, "wastesRegistryXls">>(
      WASTES_REGISTRY_XLS,
      {
        variables: {
          registryType: "INCOMING",
          sirets: [company.siret]
        }
      }
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Aucune donnée à exporter sur la période sélectionnée"
    );
  });

  it("throw FORBIDDEN error if user is not member of a siret", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const otherCompany = await companyFactory();
    const { query } = makeClient(user);
    const { errors } = await query<Pick<Query, "wastesRegistryXls">>(
      WASTES_REGISTRY_XLS,
      {
        variables: {
          registryType: "INCOMING",
          sirets: [company.siret, otherCompany.siret]
        }
      }
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].extensions?.code).toEqual(ErrorCode.FORBIDDEN);
  });

  // Test XLXS export for different registry types
  it.each(["INCOMING", "OUTGOING", "TRANSPORTED"])(
    "should download XLXS %p registry",
    async registryType => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const customFormFactory =
        registryType === "OUTGOING"
          ? emitterFormFactory
          : registryType === "INCOMING"
          ? recipientFormFactory
          : registryType === "TRANSPORTED"
          ? transporterFormFactory
          : registryType === "TRADED"
          ? traderFormFactory
          : emitterFormFactory;
      const form = await customFormFactory(user.id, company.siret!);
      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const { query } = makeClient(user);
      const { data } = await query<Pick<Query, "wastesRegistryXls">>(
        WASTES_REGISTRY_XLS,
        {
          variables: {
            registryType,
            sirets: [company.siret]
          }
        }
      );
      expect(data.wastesRegistryXls.token).not.toBeUndefined();
      expect(data.wastesRegistryXls.token).not.toBeNull();

      const request = supertest(app);
      const req = request
        .get("/download")
        .query({ token: data.wastesRegistryXls.token });

      const tmpFolder = fs.mkdtempSync(join(tmpdir(), sep));
      const filename = `${tmpFolder}/registre.xlsx`;
      const writeStream = createWriteStream(filename);

      req.pipe(writeStream);

      await new Promise<void>(resolve => {
        req.on("end", resolve);
      });

      const workbook = new Excel.Workbook();
      await workbook.xlsx.readFile(filename);
      const worksheet = workbook.getWorksheet("registre");
      expect(worksheet.rowCount).toBe(2);
      const row1 = worksheet.getRow(1);
      const row2 = worksheet.getRow(2);
      expect(row1.getCell(1).value).toEqual("N° de bordereau");
      expect(row2.getCell(1).value).toEqual(form.readableId);
    },
    30000
  );

  it.each(["INCOMING", "OUTGOING", "TRANSPORTED"])(
    "[bugfix] should contain all the columns corresponding to registry %p",
    async registryType => {
      // Given
      const { user, company } = await userWithCompanyFactory("MEMBER");

      const bsda = await bsdaFactory({
        opt: {
          wasteCode: "08 01 17*",
          status: "PROCESSED",
          createdAt: new Date(),
          destinationCompanySiret: company.siret,
          emitterCompanySiret: company.siret,
          transporterCompanySiret: company.siret,
          destinationReceptionWeight: 500,
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: new Date(),
          transporterTransportTakenOverAt: new Date(),
          destinationReceptionDate: new Date(),
          destinationOperationSignatureDate: new Date(),
          destinationOperationDate: new Date(),
          destinationOperationCode: "D 5"
        }
      });
      await indexBsda(await getBsdaForElastic(bsda));
      await refreshElasticSearch();

      const { query } = makeClient(user);
      const { data } = await query<Pick<Query, "wastesRegistryXls">>(
        WASTES_REGISTRY_XLS,
        {
          variables: {
            registryType,
            sirets: [company.siret]
          }
        }
      );
      expect(data.wastesRegistryXls.token).not.toBeUndefined();
      expect(data.wastesRegistryXls.token).not.toBeNull();

      // When
      const request = supertest(app);
      const req = request
        .get("/download")
        .query({ token: data.wastesRegistryXls.token });

      const tmpFolder = fs.mkdtempSync(join(tmpdir(), sep));
      const filename = `${tmpFolder}/registre.xlsx`;
      const writeStream = createWriteStream(filename);

      req.pipe(writeStream);

      await new Promise<void>(resolve => {
        req.on("end", resolve);
      });

      // Then
      const workbook = new Excel.Workbook();
      await workbook.xlsx.readFile(filename);
      const worksheet = workbook.getWorksheet("registre");

      // Actual columns of the sheet
      const row1 = worksheet.getRow(1);
      const worksheetColumns: Excel.CellValue[] = [];
      for (let i = 1; i <= row1.cellCount; i++) {
        worksheetColumns.push(row1.getCell(i).value);
      }

      // Expected columns
      let waste;
      if (registryType === "INCOMING") waste = emptyIncomingWaste;
      else if (registryType === "OUTGOING") waste = emptyOutgoingWaste;
      else if (registryType === "TRANSPORTED") waste = emptyTransportedWaste;

      const expectedColumns = columns
        .map(column => {
          if (Object.keys(waste).includes(column.field)) return column.label;
        })
        .filter(c => Boolean(c)); // remove undefineds

      expectedColumns.forEach(exepectedColumn =>
        expect(worksheetColumns).toContain(exepectedColumn)
      );
    },
    30000
  );
});
