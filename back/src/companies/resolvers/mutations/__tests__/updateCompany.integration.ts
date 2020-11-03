import { resetDatabase } from "../../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { AuthType } from "../../../../auth";
import { prisma } from "../../../../generated/prisma-client";

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
    $traderReceiptId: String,
    $ecoOrganismeAgreements: [URL!]
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
        traderReceiptId: $traderReceiptId,
        ecoOrganismeAgreements: $ecoOrganismeAgreements
      ){
        id
      }
    }
`;

describe("mutation updateCompany", () => {
  afterEach(resetDatabase);

  it("should update a company information", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const variables = {
      siret: company.siret,
      gerepId: "newGerepId",
      contactEmail: "newContact@trackdechets.fr",
      contactPhone: "1111111111",
      givenName: "newGivenName",
      website: "newWebsite@trackechets.fr"
    };
    const { data } = await mutate(UPDATE_COMPANY, {
      variables
    });
    expect(data.updateCompany.id).toEqual(company.id);

    const updatedCompany = await prisma.company({ id: company.id });
    expect(updatedCompany).toMatchObject(variables);
  });

  it("should return an error when trying to add eco-organisme agreements without the relevant type", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const { errors } = await mutate(UPDATE_COMPANY, {
      variables: {
        siret: company.siret,
        ecoOrganismeAgreements: ["https://legifrance.com/1"]
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Impossible de mettre à jour les agréments éco-organisme de cette entreprise : il ne s'agit pas d'un éco-organisme."
      })
    ]);
  });

  it("should return an error when trying to remove all eco-organisme agreements", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: {
        set: ["ECO_ORGANISME"]
      },
      ecoOrganismeAgreements: {
        set: ["https://legifrance.com/1"]
      }
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const { errors } = await mutate(UPDATE_COMPANY, {
      variables: {
        siret: company.siret,
        ecoOrganismeAgreements: []
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Impossible de mettre à jour les agréments éco-organisme de cette entreprise : elle doit en posséder au moins 1."
      })
    ]);
  });
});
