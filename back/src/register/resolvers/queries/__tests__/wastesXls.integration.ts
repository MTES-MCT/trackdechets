import * as Excel from "exceljs";
import fs, { createWriteStream } from "fs";
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
import { WASTES_XLS } from "./queries";
import { indexForm } from "../../../../forms/elastic";
import { getFullForm } from "../../../../forms/database";

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
      transporterCompanySiret: siret,
      status: "PROCESSED",
      sentAt: new Date(),
      receivedAt: new Date()
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

describe("query { wastesDownloadLink }", () => {
  afterEach(resetDatabase);

  it("should throw exception if register is empty", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { query } = makeClient(user);
    const { errors } = await query<Pick<Query, "wastesXls">>(WASTES_XLS, {
      variables: {
        registerType: "INCOMING",
        sirets: [company.siret]
      }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Aucune donnée à exporter sur la période sélectionnée"
    );
  });

  it("throw FORBIDDEN error if user is not member of a siret", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const otherCompany = await companyFactory();
    const { query } = makeClient(user);
    const { errors } = await query<Pick<Query, "wastesXls">>(WASTES_XLS, {
      variables: {
        registerType: "INCOMING",
        sirets: [company.siret, otherCompany.siret]
      }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].extensions.code).toEqual(ErrorCode.FORBIDDEN);
  });

  // Test XLXS export for different register types
  it.each(["INCOMING", "OUTGOING", "TRANSPORTED"])(
    "should download XLXS %p register",
    async registerType => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const customFormFactory =
        registerType === "OUTGOING"
          ? emitterFormFactory
          : registerType === "INCOMING"
          ? recipientFormFactory
          : registerType === "TRANSPORTED"
          ? transporterFormFactory
          : registerType === "TRADED"
          ? traderFormFactory
          : emitterFormFactory;
      const form = await customFormFactory(user.id, company.siret);
      await indexForm(await getFullForm(form));
      await refreshElasticSearch();
      const { query } = makeClient(user);
      const { data } = await query<Pick<Query, "wastesXls">>(WASTES_XLS, {
        variables: {
          registerType,
          sirets: [company.siret]
        }
      });
      expect(data.wastesXls.token).not.toBeUndefined();
      expect(data.wastesXls.token).not.toBeNull();

      const request = supertest(app);
      const req = request
        .get("/download")
        .query({ token: data.wastesXls.token });

      const tmpFolder = fs.mkdtempSync("/");
      const filename = `${tmpFolder}/registre.xlsx`;
      const writeStream = createWriteStream(filename);

      req.pipe(writeStream);

      await new Promise<void>(resolve => {
        req.on("end", async () => {
          resolve();
        });
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
});
