import * as Excel from "exceljs";
import fs, { createWriteStream } from "fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import {
  refreshElasticSearch,
  resetDatabase
} from "../../../../../integration-tests/helper";
import { GovernmentPermission } from "@prisma/client";
import supertest from "supertest";
import { ErrorCode } from "../../../../common/errors";
import { app } from "../../../../server";
import {
  companyFactory,
  formFactory,
  userWithCompanyFactory,
  userWithAccessTokenFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import type { Query } from "@td/codegen-back";
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
import { faker } from "@faker-js/faker";

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
          number: 1,
          takenOverAt: new Date()
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

  it("should allow user to download csv from any siret if authenticated from a service account", async () => {
    // the company and owner to build a registry
    const { user: owner, company: someCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const request = supertest(app);

    const allowedIP = faker.internet.ipv4();
    // the gov account which will download the registry
    const { accessToken } = await userWithAccessTokenFactory({
      governmentAccount: {
        create: {
          name: "FICHE_ETABLISSEMENT",
          permissions: [GovernmentPermission.REGISTRY_CAN_READ_ALL],
          authorizedOrgIds: ["ALL"],
          authorizedIPs: [allowedIP]
        }
      }
    });
    const form = await recipientFormFactory(owner.id, someCompany.siret!);
    await indexForm(await getFormForElastic(form));
    await refreshElasticSearch();
    const res = await request
      .post("/")
      .send({
        query: `{ wastesRegistryXls(sirets: ["${someCompany.siret}"], registryType: ALL) { token } }`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);

    const downloadToken = res.body.data.wastesRegistryXls.token;

    expect(downloadToken).toHaveLength(10); // token generated by a getUid(10)
  });

  it("should forbid user to download xls if no service account is associated and user is not admin", async () => {
    // the company and owner to build a registry
    const { user: owner, company: someCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const request = supertest(app);

    const userIP = faker.internet.ipv4();
    // the gov account which will download the registry
    const { accessToken } = await userWithAccessTokenFactory();
    const form = await recipientFormFactory(owner.id, someCompany.siret!);
    await indexForm(await getFormForElastic(form));
    await refreshElasticSearch();
    const res = await request
      .post("/")
      .send({
        query: `{ wastesRegistryXls(sirets: ["${someCompany.siret}"], registryType: ALL) { token } }`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", userIP);
    const { errors } = res.body;

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      `Vous n'êtes pas autorisé à accéder au registre de l'établissement portant le n°SIRET ${someCompany.siret}`
    );
  });

  it("should forbid service account user to download xls from any siret if IPs do not match", async () => {
    // the company and owner to build a registry
    const { user: owner, company: someCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const request = supertest(app);

    const allowedIP = faker.internet.ipv4();
    const userIP = faker.internet.ipv4();
    // the gov account which will download the registry
    const { accessToken } = await userWithAccessTokenFactory({
      governmentAccount: {
        create: {
          name: "FICHE_ETABLISSEMENT",
          permissions: [GovernmentPermission.REGISTRY_CAN_READ_ALL],
          authorizedOrgIds: ["ALL"],
          authorizedIPs: [allowedIP]
        }
      }
    });
    const form = await recipientFormFactory(owner.id, someCompany.siret!);
    await indexForm(await getFormForElastic(form));
    await refreshElasticSearch();
    const res = await request
      .post("/")
      .send({
        query: `{ wastesRegistryXls(sirets: ["${someCompany.siret}"], registryType: ALL) { token } }`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", userIP);
    const { errors } = res.body;

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      `Vous n'êtes pas autorisé à accéder au registre de l'établissement portant le n°SIRET ${someCompany.siret}`
    );
  });

  it("should allow admin user to download xls from any siret", async () => {
    // the company and owner to build a registry
    const { user: owner, company: someCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const request = supertest(app);

    const userIP = faker.internet.ipv4();

    // user is admin
    const { accessToken } = await userWithAccessTokenFactory({ isAdmin: true });

    const form = await recipientFormFactory(owner.id, someCompany.siret!);
    await indexForm(await getFormForElastic(form));
    await refreshElasticSearch();

    const res = await request
      .post("/")
      .send({
        query: `{ wastesRegistryXls(sirets: ["${someCompany.siret}"], registryType: ALL) { token } }`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", userIP);

    const downloadToken = res.body.data.wastesRegistryXls.token;

    expect(downloadToken).toHaveLength(10); // token generated by a getUid(10)
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
        req.on("end", async () => {
          writeStream.on("finish", () => resolve());
        });
      });

      const workbook = new Excel.Workbook();
      await workbook.xlsx.readFile(filename);
      const worksheet = workbook.getWorksheet("registre")!;
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
          destinationReceptionWeight: 500,
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: new Date(),
          destinationReceptionDate: new Date(),
          destinationOperationSignatureDate: new Date(),
          destinationOperationDate: new Date(),
          destinationOperationCode: "D 5"
        },
        transporterOpt: {
          transporterCompanySiret: company.siret,
          transporterTransportTakenOverAt: new Date(),
          transporterTransportSignatureDate: new Date()
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
        req.on("end", async () => {
          writeStream.on("finish", () => resolve());
        });
      });

      // Then
      const workbook = new Excel.Workbook();
      await workbook.xlsx.readFile(filename);
      const worksheet = workbook.getWorksheet("registre")!;

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
