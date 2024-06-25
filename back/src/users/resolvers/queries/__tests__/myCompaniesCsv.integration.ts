import supertest from "supertest";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { companyFactory, userFactory } from "../../../../__tests__/factories";
import { associateUserToCompany } from "../../../database";
import { app } from "../../../../server";
import makeClient from "../../../../__tests__/testClient";
import gql from "graphql-tag";
import { Query } from "../../../../generated/graphql/types";
import { parseString } from "@fast-csv/parse";
import { formatDate, formatRole } from "../../../export/columns";

const MY_COMPANIES_CSV = gql`
  query MyCompaniesCsv {
    myCompaniesCsv {
      token
      downloadLink
    }
  }
`;

describe("query { myCompaniesCsv }", () => {
  afterEach(resetDatabase);

  it("should export all companies a user is part of in CSV", async () => {
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
    const { data, errors } = await query<Pick<Query, "myCompaniesCsv">>(
      MY_COMPANIES_CSV
    );
    expect(errors).toBeUndefined();
    expect(data.myCompaniesCsv?.token?.length).toBeGreaterThan(0);
    expect(data.myCompaniesCsv?.downloadLink?.length).toBeGreaterThan(0);

    const request = supertest(app);

    const res = await request
      .get("/download")
      .query({ token: data.myCompaniesCsv!.token });

    expect(res.status).toBe(200);

    const rows: any[] = [];

    parseString(res.text, { headers: true, delimiter: ";" })
      .on("data", row => rows.push(row))
      .on("end", (rowCount: number) => {
        expect(rowCount).toEqual(4);
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
  });
});
