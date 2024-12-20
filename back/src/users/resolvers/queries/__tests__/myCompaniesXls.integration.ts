import { join, sep } from "node:path";
import { tmpdir } from "node:os";
import fs, { createWriteStream } from "fs";
import { companyFactory, userFactory } from "../../../../__tests__/factories";
import { associateUserToCompany } from "../../../database";
import makeClient from "../../../../__tests__/testClient";
import type { Query } from "@td/codegen-back";
import gql from "graphql-tag";
import supertest from "supertest";
import { app } from "../../../../server";
import { resetDatabase } from "../../../../../integration-tests/helper";
import * as Excel from "exceljs";
import { formatDate, formatRole } from "../../../export/columns";

const MY_COMPANIES_XLS = gql`
  query MyCompaniesCsv {
    myCompaniesXls {
      token
      downloadLink
    }
  }
`;

describe("query { myCompaniesXls }", () => {
  afterEach(resetDatabase);

  it("should export all companies a user is part of in XLS", async () => {
    const user1 = await userFactory();
    const user2 = await userFactory();
    const user3 = await userFactory();

    const company1 = await companyFactory({ givenName: "COMPANY_1" });
    const company2 = await companyFactory({ givenName: "COMPANY_2" });

    const association1 = await associateUserToCompany(
      user1.id,
      company1.orgId,
      "ADMIN"
    );
    const association2 = await associateUserToCompany(
      user2.id,
      company1.orgId,
      "MEMBER"
    );
    const association3 = await associateUserToCompany(
      user1.id,
      company2.orgId,
      "ADMIN"
    );
    const association4 = await associateUserToCompany(
      user3.id,
      company2.orgId,
      "MEMBER"
    );

    const { query } = makeClient(user1);
    const { data, errors } = await query<Pick<Query, "myCompaniesXls">>(
      MY_COMPANIES_XLS
    );
    expect(errors).toBeUndefined();

    expect(data.myCompaniesXls?.token?.length).toBeGreaterThan(0);
    expect(data.myCompaniesXls?.downloadLink?.length).toBeGreaterThan(0);

    const request = supertest(app);
    const req = request
      .get("/download")
      .query({ token: data.myCompaniesXls!.token });

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
    const worksheet = workbook.getWorksheet("etablissements")!;
    expect(worksheet.rowCount).toBe(5);
    const headers = worksheet.getRow(1);
    const rows = [2, 3, 4, 5].map(n => {
      const row = worksheet.getRow(n);
      let rowWithLabels = {};
      headers.eachCell((cell, colNumber) => {
        rowWithLabels = {
          ...rowWithLabels,
          [cell.value as string]: row.getCell(colNumber).value
        };
      });
      return rowWithLabels;
    });
    expect(rows[0]).toMatchObject({
      "SIRET ou n° de TVA intracommunautaire": company1.orgId,
      "Raison sociale": company1.name,
      "Nom usuel de l'établissement": company1.givenName,
      "Nom et prénom du membre": user1.name,
      "E-mail du membre": user1.email,
      "Date d'ajout du membre": formatDate(association1.createdAt),
      Rôle: formatRole(association1.role)
    });
    expect(rows[1]).toMatchObject({
      "SIRET ou n° de TVA intracommunautaire": company1.orgId,
      "Raison sociale": company1.name,
      "Nom usuel de l'établissement": company1.givenName,
      "Nom et prénom du membre": user2.name,
      "E-mail du membre": user2.email,
      "Date d'ajout du membre": formatDate(association2.createdAt),
      Rôle: formatRole(association2.role)
    });
    expect(rows[2]).toMatchObject({
      "SIRET ou n° de TVA intracommunautaire": company2.orgId,
      "Raison sociale": company2.name,
      "Nom usuel de l'établissement": company2.givenName,
      "Nom et prénom du membre": user1.name,
      "E-mail du membre": user1.email,
      "Date d'ajout du membre": formatDate(association3.createdAt),
      Rôle: formatRole(association3.role)
    });
    expect(rows[3]).toMatchObject({
      "SIRET ou n° de TVA intracommunautaire": company2.orgId,
      "Raison sociale": company2.name,
      "Nom usuel de l'établissement": company2.givenName,
      "Nom et prénom du membre": user3.name,
      "E-mail du membre": user3.email,
      "Date d'ajout du membre": formatDate(association4.createdAt),
      Rôle: formatRole(association4.role)
    });
  });

  it("should paginate correctly if user has more than chunk size (100) companies", async () => {
    const user = await userFactory();
    const companyCount = 150;
    for (let i = 0; i < companyCount; i++) {
      const company = await companyFactory();
      await associateUserToCompany(user.id, company.orgId, "ADMIN");
    }

    const { query } = makeClient(user);
    const { data, errors } = await query<Pick<Query, "myCompaniesXls">>(
      MY_COMPANIES_XLS
    );
    expect(errors).toBeUndefined();

    expect(data.myCompaniesXls?.token?.length).toBeGreaterThan(0);
    expect(data.myCompaniesXls?.downloadLink?.length).toBeGreaterThan(0);

    const request = supertest(app);
    const req = request
      .get("/download")
      .query({ token: data.myCompaniesXls!.token });

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
    const worksheet = workbook.getWorksheet("etablissements")!;
    expect(worksheet.rowCount).toBe(companyCount + 1); //+1 for header
  });
});
