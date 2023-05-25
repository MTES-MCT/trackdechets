import { parseString } from "@fast-csv/parse";
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
  formFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { Query } from "../../../../generated/graphql/types";
import { indexForm } from "../../../elastic";
import { getFullForm } from "../../../database";

async function emitterFormFactory(ownerId: string, siret: string) {
  const form = await formFactory({
    ownerId,
    opt: { emitterCompanySiret: siret, sentAt: new Date() }
  });
  await indexForm(await getFullForm(form));
  return form;
}

async function recipientFormFactory(ownerId: string, siret: string) {
  const form = await formFactory({
    ownerId,
    opt: {
      recipientCompanySiret: siret,
      receivedAt: new Date()
    }
  });
  await indexForm(await getFullForm(form));
  return form;
}

async function transporterFormFactory(ownerId: string, siret: string) {
  const form = await formFactory({
    ownerId,
    opt: {
      sentAt: new Date(),
      transporters: {
        create: {
          transporterCompanySiret: siret
        }
      }
    }
  });
  await indexForm(await getFullForm(form));
  return form;
}

async function traderFormFactory(ownerId: string, siret: string) {
  const form = await formFactory({
    ownerId,
    opt: { traderCompanySiret: siret, sentAt: new Date() }
  });
  await indexForm(await getFullForm(form));
  return form;
}

describe("query { formsRegister }", () => {
  afterEach(() => resetDatabase());

  it("should throw exception if register is empty", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { query } = makeClient(user);
    const { errors } = await query<Pick<Query, "formsRegister">>(`
      query {
        formsRegister(sirets: ["${company.siret}"], exportType: OUTGOING, exportFormat: CSV) {
          token
          downloadLink
        }
      }
    `);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Aucune donnée à exporter sur la période sélectionnée"
    );
  });

  it("throw FORBIDDEN error if user is not member of a siret", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { query } = makeClient(user);
    const { errors } = await query<Pick<Query, "formsRegister">>(`
      query {
        formsRegister(sirets: ["${company.siret}", "22222222222222"], exportType: OUTGOING, exportFormat: CSV) {
          token
          downloadLink
        }
      }
    `);
    expect(errors).toHaveLength(1);
    expect(errors[0].extensions.code).toEqual(ErrorCode.FORBIDDEN);
  });

  // Test CSV export for different exportType
  ["INCOMING", "OUTGOING", "TRANSPORTED", "TRADED", "ALL"].forEach(
    exportType => {
      it(`should download CSV ${exportType} exports`, async () => {
        const { user, company } = await userWithCompanyFactory("MEMBER");

        const customFormFactory =
          exportType === "OUTGOING"
            ? emitterFormFactory
            : exportType === "INCOMING"
            ? recipientFormFactory
            : exportType === "TRANSPORTED"
            ? transporterFormFactory
            : exportType === "TRADED"
            ? traderFormFactory
            : emitterFormFactory;

        const form = await customFormFactory(user.id, company.siret!);

        await refreshElasticSearch();

        const { query } = makeClient(user);

        const { data } = await query<Pick<Query, "formsRegister">>(`
          query {
            formsRegister(sirets: ["${company.siret}"], exportType: ${exportType}, exportFormat: CSV) {
              token
              downloadLink
            }
          }
        `);

        expect(data.formsRegister.token).not.toBeUndefined();
        expect(data.formsRegister.token).not.toBeNull();

        const request = supertest(app);

        const res = await request
          .get("/download")
          .query({ token: data.formsRegister.token });

        expect(res.status).toBe(200);

        const rows: any[] = [];

        parseString(res.text, { headers: true, delimiter: ";" })
          .on("data", row => rows.push(row))
          .on("end", (rowCount: number) => {
            expect(rowCount).toEqual(1);
            const row = rows[0];
            expect(row["N° de bordereau"]).toEqual(form.readableId);
          });
      });
    }
  );

  // Test XLXS export for different exportType
  ["INCOMING", "OUTGOING", "TRANSPORTED", "TRADED", "ALL"].forEach(
    exportType => {
      it(`should download XLXS ${exportType} exports`, async () => {
        const { user, company } = await userWithCompanyFactory("MEMBER");

        const customFormFactory =
          exportType === "OUTGOING"
            ? emitterFormFactory
            : exportType === "INCOMING"
            ? recipientFormFactory
            : exportType === "TRANSPORTED"
            ? transporterFormFactory
            : exportType === "TRADED"
            ? traderFormFactory
            : emitterFormFactory;

        const form = await customFormFactory(user.id, company.siret!);
        await refreshElasticSearch();

        const { query } = makeClient(user);

        const { data } = await query<Pick<Query, "formsRegister">>(`
          query {
            formsRegister(sirets: ["${company.siret}"], exportType: ${exportType}, exportFormat: XLSX) {
              token
              downloadLink
            }
          }
        `);

        expect(data.formsRegister.token).not.toBeUndefined();
        expect(data.formsRegister.token).not.toBeNull();

        const request = supertest(app);

        const req = request
          .get("/download")
          .query({ token: data.formsRegister.token });

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
      });
    }
  );
});
