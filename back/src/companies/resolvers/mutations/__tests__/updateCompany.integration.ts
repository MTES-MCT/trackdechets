import { resetDatabase } from "../../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { AuthType } from "../../../../auth";
import { prisma } from "../../../../generated/prisma-client";
import { ExecutionResult } from "graphql";
import { Mutation } from "../../../../generated/graphql/types";

const UPDATE_COMPANY = `
  mutation UpdateCompany(
    $siret: String!,
    $gerepId: String,
    $contactEmail: String,
    $contactPhone: String,
    $website: String,
    $companyTypes: [CompanyType],
    $givenName: String,
    $transporterReceiptId: String,
    $traderReceiptId: String
    ){
      updateCompany(
        siret: $siret,
        gerepId: $gerepId,
        contactEmail: $contactEmail,
        contactPhone: $contactPhone,
        companyTypes: $companyTypes,
        website: $website,
        givenName: $givenName,
        transporterReceiptId: $transporterReceiptId,
        traderReceiptId: $traderReceiptId
      ){
        id
      }
    }
`;

describe("mutation updateCompany", () => {
  afterAll(resetDatabase);
  it("should update a company information", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const gerepId = "newGerepId";
    const contactEmail = "newContact@trackdechets.fr";
    const contactPhone = "1111111111";
    const givenName = "newGivenName";
    const website = "newWebsite@trackechets.fr";
    const { data } = await mutate<
      ExecutionResult<Pick<Mutation, "updateCompany">>
    >(UPDATE_COMPANY, {
      variables: {
        siret: company.siret,
        gerepId,
        contactEmail,
        contactPhone,
        givenName,
        website
      }
    });
    expect(data.updateCompany.id).toEqual(company.id);
    const updatedCompany = await prisma.company({ id: company.id });
    expect(updatedCompany.gerepId).toEqual(gerepId);
    expect(updatedCompany.contactEmail).toEqual(contactEmail);
    expect(updatedCompany.contactPhone).toEqual(contactPhone);
    expect(updatedCompany.givenName).toEqual(givenName);
    expect(updatedCompany.website).toEqual(website);
  });
});
