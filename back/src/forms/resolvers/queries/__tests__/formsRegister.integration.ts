import { parseString } from "@fast-csv/parse";
import * as Excel from "exceljs";
import fs, { createWriteStream } from "fs";
import { resetDatabase } from "integration-tests/helper";
import prisma from "src/prisma";
import supertest from "supertest";
import { ErrorCode } from "../../../../common/errors";
import { app } from "../../../../server";
import {
  formFactory,
  formWithTempStorageFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

function emitterFormFactory(ownerId: string, siret: string) {
  return formFactory({
    ownerId,
    opt: { emitterCompanySiret: siret, status: "PROCESSED" }
  });
}

function recipientFormFactory(ownerId: string, siret: string) {
  return formFactory({
    ownerId,
    opt: { recipientCompanySiret: siret, status: "PROCESSED" }
  });
}

function transporterFormFactory(ownerId: string, siret: string) {
  return formFactory({
    ownerId,
    opt: { transporterCompanySiret: siret, status: "PROCESSED" }
  });
}

function traderFormFactory(ownerId: string, siret: string) {
  return formFactory({
    ownerId,
    opt: { traderCompanySiret: siret, status: "PROCESSED" }
  });
}

describe("query { formsRegister }", () => {
  afterEach(() => resetDatabase());

  it("should throw exception if register is empty", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { query } = makeClient(user);
    const { errors } = await query(`
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
    const { errors } = await query(`
      query {
        formsRegister(sirets: ["${company.siret}", "11111111111111"], exportType: OUTGOING, exportFormat: CSV) {
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

        const form = await customFormFactory(user.id, company.siret);

        const { query } = makeClient(user);

        const { data } = await query(`
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

        const rows = [];

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

        const form = await customFormFactory(user.id, company.siret);

        const { query } = makeClient(user);

        const { data } = await query(`
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

        await new Promise(resolve => {
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

  it("should returns specific columns for temporary storage", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const form = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const tempStorageDetail = await prisma.form
      .findUnique({ where: { id: form.id } })
      .temporaryStorageDetail();

    const { query } = makeClient(user);

    const { data } = await query(`
      query {
        formsRegister(sirets: ["${company.siret}"], exportType: OUTGOING, exportFormat: CSV) {
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

    const rows = [];

    parseString(res.text, { headers: true, delimiter: ";" })
      .on("data", row => rows.push(row))
      .on("end", (rowCount: number) => {
        expect(rowCount).toEqual(1);
        const row = rows[0];
        expect(row["Entreposage ou reconditonnement siret"]).toEqual(
          form.recipientCompanySiret
        );
        expect(row["Entreposage ou reconditonnement nom"]).toEqual(
          form.recipientCompanyName
        );
        expect(row["Entreposage ou reconditonnement contact"]).toEqual(
          form.recipientCompanyContact
        );
        expect(row["Entreposage ou reconditonnement N°tél"]).toEqual(
          form.recipientCompanyPhone
        );
        expect(row["Entreposage ou reconditonnement adresse"]).toEqual(
          form.recipientCompanyAddress
        );
        expect(row["Entreposage ou reconditonnement email"]).toEqual(
          form.recipientCompanyMail
        );
        expect(row["Destination siret"]).toEqual(
          tempStorageDetail.destinationCompanySiret
        );
        expect(row["Destination nom"]).toEqual(
          tempStorageDetail.destinationCompanyName
        );
        expect(row["Destination adresse"]).toEqual(
          tempStorageDetail.destinationCompanyAddress
        );
        expect(row["Destination email"]).toEqual(
          tempStorageDetail.destinationCompanyMail
        );
        expect(
          row["Transporteur après entreposage ou reconditionnement siret"]
        ).toEqual(tempStorageDetail.transporterCompanySiret);
        expect(
          row["Transporteur après entreposage ou reconditionnement nom"]
        ).toEqual(tempStorageDetail.transporterCompanyName);
        expect(
          row["Transporteur après entreposage ou reconditionnement adresse"]
        ).toEqual(tempStorageDetail.transporterCompanyAddress);
        expect(
          row[
            "Transporteur après entreposage ou reconditionnement exemption de récépissé"
          ]
        ).toEqual("N");
        expect(
          row["Transporteur après entreposage ou reconditionnement récépissé"]
        ).toEqual(tempStorageDetail.transporterReceipt);
        expect(
          row[
            "Transporteur après entreposage ou reconditionnement récépissé validité"
          ]
        ).toEqual("2019-11-27");
        expect(
          row[
            "Transporteur après entreposage ou reconditionnement plaque d'immatriculation"
          ]
        ).toEqual(tempStorageDetail.transporterNumberPlate);
      });
  });
});
