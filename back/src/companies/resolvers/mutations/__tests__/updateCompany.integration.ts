import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { AuthType } from "../../../../auth";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { Mutation } from "../../../../generated/graphql/types";
import { libelleFromCodeNaf } from "../../../sirene/utils";
import { CollectorType, CompanyType, WasteProcessorType } from "@prisma/client";

const mockGetUpdatedCompanyNameAndAddress = jest.fn();
// Mock external search services
jest.mock("../../../database", () => ({
  // https://www.chakshunyu.com/blog/how-to-mock-only-one-function-from-a-module-in-jest/
  ...jest.requireActual("../../../database"),
  getUpdatedCompanyNameAndAddress: (...args) =>
    mockGetUpdatedCompanyNameAndAddress(...args)
}));

const UPDATE_COMPANY = `
  mutation UpdateCompany(
    $id: String!,
    $gerepId: String,
    $contactEmail: String,
    $contactPhone: String,
    $website: String,
    $companyTypes: [CompanyType!],
    $collectorTypes: [CollectorType!],
    $wasteProcessorTypes: [WasteProcessorType!],
    $givenName: String,
    $transporterReceiptId: String,
    $traderReceiptId: String,
    $ecoOrganismeAgreements: [URL!],
    $allowBsdasriTakeOverWithoutSignature: Boolean
    ){
      updateCompany(
        id: $id,
        gerepId: $gerepId,
        contactEmail: $contactEmail,
        contactPhone: $contactPhone,
        companyTypes: $companyTypes,
        collectorTypes: $collectorTypes,
        wasteProcessorTypes: $wasteProcessorTypes,
        website: $website,
        givenName: $givenName,
        transporterReceiptId: $transporterReceiptId,
        traderReceiptId: $traderReceiptId,
        ecoOrganismeAgreements: $ecoOrganismeAgreements,
        allowBsdasriTakeOverWithoutSignature: $allowBsdasriTakeOverWithoutSignature,
      ){
        id
        name
        address
        naf
        libelleNaf
      }
    }
`;

describe("mutation updateCompany", () => {
  afterEach(async () => {
    await resetDatabase();
    mockGetUpdatedCompanyNameAndAddress.mockReset();
  });

  it("should update a company information", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const variables = {
      id: company.id,
      gerepId: "newGerepId",
      contactEmail: "newContact@trackdechets.fr",
      contactPhone: "1111111111",
      givenName: "newGivenName",
      website: "http://newWebsite@trackechets.fr",
      allowBsdasriTakeOverWithoutSignature: true
    };
    const { data } = await mutate<Pick<Mutation, "updateCompany">>(
      UPDATE_COMPANY,
      {
        variables
      }
    );
    expect(data.updateCompany.id).toEqual(company.id);

    const updatedCompany = await prisma.company.findUnique({
      where: { id: company.id }
    });
    expect(updatedCompany).toMatchObject(variables);
  });

  it("should update a french company information with name and adresse from Sirene index", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      codeNaf: "0112Z"
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const variables = {
      id: company.id
    };
    mockGetUpdatedCompanyNameAndAddress.mockResolvedValueOnce({
      name: "nom de sirene",
      address: "l'adresse de sirene"
    });
    const { data } = await mutate<Pick<Mutation, "updateCompany">>(
      UPDATE_COMPANY,
      {
        variables
      }
    );
    expect(data.updateCompany.id).toEqual(company.id);
    expect(data.updateCompany.name).toEqual("nom de sirene");
    expect(data.updateCompany.address).toEqual("l'adresse de sirene");
    expect(data.updateCompany.naf).toEqual(company.codeNaf);
    expect(data.updateCompany.libelleNaf).toEqual(
      libelleFromCodeNaf(company.codeNaf!)
    );

    const updatedCompany = await prisma.company.findUnique({
      where: { id: company.id }
    });
    expect(updatedCompany).toMatchObject({
      name: data.updateCompany?.name,
      address: data.updateCompany?.address,
      codeNaf: data.updateCompany?.naf
    });
  });

  it("should update a foreign company information with name and adresse from Sirene index", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      vatNumber: "RO17579668",
      name: "Acme in EU",
      address: "Transporter street",
      companyTypes: ["TRANSPORTER"],
      codeNaf: "0112Z"
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const variables = {
      id: company.id
    };
    mockGetUpdatedCompanyNameAndAddress.mockResolvedValueOnce({
      name: "nom de vies",
      address: "l'adresse de vies"
    });
    const { data } = await mutate<Pick<Mutation, "updateCompany">>(
      UPDATE_COMPANY,
      {
        variables
      }
    );
    expect(data.updateCompany.id).toEqual(company.id);
    expect(data.updateCompany.name).toEqual("nom de vies");
    expect(data.updateCompany.address).toEqual("l'adresse de vies");
    expect(data.updateCompany.naf).toEqual(company.codeNaf);
    expect(data.updateCompany.libelleNaf).toEqual(
      libelleFromCodeNaf(company.codeNaf!)
    );

    const updatedCompany = await prisma.company.findUnique({
      where: { id: company.id }
    });
    expect(updatedCompany).toMatchObject({
      name: data.updateCompany.name,
      address: data.updateCompany.address,
      codeNaf: data.updateCompany?.naf
    });
  });

  it("should forbid xss injection on website field", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const variables = {
      id: company.id,
      gerepId: "newGerepId",
      contactEmail: "newContact@trackdechets.fr",
      contactPhone: "1111111111",
      givenName: "newGivenName",
      website: "javascript:alert(1)",
      allowBsdasriTakeOverWithoutSignature: true
    };
    const { errors } = await mutate<Pick<Mutation, "updateCompany">>(
      UPDATE_COMPANY,
      {
        variables
      }
    );
    expect(errors).toEqual([
      expect.objectContaining({
        message: "L'url est invalide"
      })
    ]);
  });

  it("should return an error when trying to add eco-organisme agreements without the relevant type", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const { errors } = await mutate(UPDATE_COMPANY, {
      variables: {
        id: company.id,
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
        id: company.id,
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

  it("should return an error when trying to change Company type of a TRANSPORTER identified by VAT number", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: {
        set: ["TRANSPORTER"]
      },
      vatNumber: "RO17579668",
      siret: "RO17579668"
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const { errors } = await mutate(UPDATE_COMPANY, {
      variables: {
        id: company.id,
        companyTypes: ["ECO_ORGANISME", "TRANSPORTER"]
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Impossible de changer de type TRANSPORTER pour un établissement transporteur étranger"
      })
    ]);

    const { errors: errors2 } = await mutate(UPDATE_COMPANY, {
      variables: {
        id: company.id,
        companyTypes: ["TRANSPORTER"]
      }
    });

    expect(errors2).toBeUndefined();
  });

  it("should update a company's collectorTypes", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: [CompanyType.COLLECTOR]
    });

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await mutate<Pick<Mutation, "updateCompany">>(
      UPDATE_COMPANY,
      {
        variables: {
          id: company.id,
          collectorTypes: [CollectorType.DANGEROUS_WASTES]
        }
      }
    );

    // Then
    expect(data.updateCompany.id).toEqual(company.id);

    const updatedCompany = await prisma.company.findUnique({
      where: { id: company.id }
    });
    expect(updatedCompany).toMatchObject({
      companyTypes: [CompanyType.COLLECTOR],
      collectorTypes: [CollectorType.DANGEROUS_WASTES]
    });
  });

  it("collectorTypes must be valid", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: [CompanyType.COLLECTOR]
    });

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate<Pick<Mutation, "updateCompany">>(
      UPDATE_COMPANY,
      {
        variables: {
          id: company.id,
          collectorTypes: [WasteProcessorType.CREMATION]
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      `Variable "$collectorTypes" got invalid value "CREMATION" at "collectorTypes[0]"; Value "CREMATION" does not exist in "CollectorType" enum.`
    );
  });

  it("should not update a company's collectorTypes if not collector", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: [CompanyType.PRODUCER]
    });

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate<Pick<Mutation, "updateCompany">>(
      UPDATE_COMPANY,
      {
        variables: {
          id: company.id,
          collectorTypes: [CollectorType.DANGEROUS_WASTES]
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      "Your company needs to be a Collector to have collectorTypes"
    );
  });

  it("should update a company's collectorTypes if not collector but updating to collector", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: [CompanyType.PRODUCER]
    });

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate<Pick<Mutation, "updateCompany">>(
      UPDATE_COMPANY,
      {
        variables: {
          id: company.id,
          companyTypes: [CompanyType.COLLECTOR],
          collectorTypes: [
            CollectorType.DANGEROUS_WASTES,
            CollectorType.OTHER_DANGEROUS_WASTES
          ]
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    const updatedCompany = await prisma.company.findUnique({
      where: { id: company.id }
    });
    expect(updatedCompany).toMatchObject({
      companyTypes: [CompanyType.COLLECTOR],
      collectorTypes: [
        CollectorType.DANGEROUS_WASTES,
        CollectorType.OTHER_DANGEROUS_WASTES
      ]
    });
  });

  it("should not save duplicated collector types", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: [CompanyType.COLLECTOR]
    });

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate<Pick<Mutation, "updateCompany">>(
      UPDATE_COMPANY,
      {
        variables: {
          id: company.id,
          collectorTypes: [
            CollectorType.DANGEROUS_WASTES,
            CollectorType.DANGEROUS_WASTES
          ]
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    const updatedCompany = await prisma.company.findUnique({
      where: { id: company.id }
    });
    expect(updatedCompany).toMatchObject({
      companyTypes: [CompanyType.COLLECTOR],
      collectorTypes: [CollectorType.DANGEROUS_WASTES]
    });
  });

  it("if no longer collector, should remove collector types", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: [CompanyType.COLLECTOR],
      collectorTypes: [
        CollectorType.DANGEROUS_WASTES,
        CollectorType.DEEE_WASTES
      ]
    });

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate<Pick<Mutation, "updateCompany">>(
      UPDATE_COMPANY,
      {
        variables: {
          id: company.id,
          companyTypes: [CompanyType.PRODUCER]
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    const updatedCompany = await prisma.company.findUnique({
      where: { id: company.id }
    });
    expect(updatedCompany).toMatchObject({
      companyTypes: [CompanyType.PRODUCER],
      collectorTypes: []
    });
  });

  it.each([null, undefined, []])(
    "user can manually remove collector types (value '%p')",
    async collectorTypes => {
      // Given
      const { user, company } = await userWithCompanyFactory("ADMIN", {
        companyTypes: [CompanyType.COLLECTOR],
        collectorTypes: [
          CollectorType.DANGEROUS_WASTES,
          CollectorType.DEEE_WASTES
        ]
      });

      // When
      const { mutate } = makeClient({ ...user, auth: AuthType.Session });
      const { errors } = await mutate<Pick<Mutation, "updateCompany">>(
        UPDATE_COMPANY,
        {
          variables: {
            id: company.id,
            collectorTypes
          }
        }
      );

      // Then
      expect(errors).toBeUndefined();

      const updatedCompany = await prisma.company.findUnique({
        where: { id: company.id }
      });
      expect(updatedCompany).toMatchObject({
        companyTypes: [CompanyType.COLLECTOR],
        collectorTypes: []
      });
    }
  );

  it("user can omit collector types (optional)", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: [CompanyType.COLLECTOR],
      collectorTypes: [CollectorType.DEEE_WASTES]
    });

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate<Pick<Mutation, "updateCompany">>(
      UPDATE_COMPANY,
      {
        variables: {
          id: company.id,
          codeNaf: "0112Z"
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    const updatedCompany = await prisma.company.findUnique({
      where: { id: company.id }
    });
    expect(updatedCompany).toMatchObject({
      companyTypes: [CompanyType.COLLECTOR],
      collectorTypes: [CollectorType.DEEE_WASTES]
    });
  });

  it("should update a company's wasteProcessorTypes", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: [CompanyType.WASTEPROCESSOR]
    });

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await mutate<Pick<Mutation, "updateCompany">>(
      UPDATE_COMPANY,
      {
        variables: {
          id: company.id,
          wasteProcessorTypes: [WasteProcessorType.CREMATION]
        }
      }
    );

    // Then
    expect(data.updateCompany.id).toEqual(company.id);

    const updatedCompany = await prisma.company.findUnique({
      where: { id: company.id }
    });
    expect(updatedCompany).toMatchObject({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.CREMATION]
    });
  });

  it("wasteProcessorTypes must be valid", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: [CompanyType.WASTEPROCESSOR]
    });

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate<Pick<Mutation, "updateCompany">>(
      UPDATE_COMPANY,
      {
        variables: {
          id: company.id,
          wasteProcessorTypes: [CollectorType.DEEE_WASTES]
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      `Variable "$wasteProcessorTypes" got invalid value "DEEE_WASTES" at "wasteProcessorTypes[0]"; Value "DEEE_WASTES" does not exist in "WasteProcessorType" enum.`
    );
  });

  it("should not update a company's wasteProcessorTypes if not waste processor", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: [CompanyType.PRODUCER]
    });

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate<Pick<Mutation, "updateCompany">>(
      UPDATE_COMPANY,
      {
        variables: {
          id: company.id,
          wasteProcessorTypes: [WasteProcessorType.CREMATION]
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      "Your company needs to be a WasteProcessor to have wasteProcessorTypes"
    );
  });

  it("should update a company's wasteProcessorTypes if not waste processor but updating to waste processor", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: [CompanyType.PRODUCER]
    });

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate<Pick<Mutation, "updateCompany">>(
      UPDATE_COMPANY,
      {
        variables: {
          id: company.id,
          companyTypes: [CompanyType.WASTEPROCESSOR],
          wasteProcessorTypes: [WasteProcessorType.CREMATION]
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    const updatedCompany = await prisma.company.findUnique({
      where: { id: company.id }
    });
    expect(updatedCompany).toMatchObject({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.CREMATION]
    });
  });

  it("should not save duplicated waste processor types", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: [CompanyType.WASTEPROCESSOR]
    });

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate<Pick<Mutation, "updateCompany">>(
      UPDATE_COMPANY,
      {
        variables: {
          id: company.id,
          wasteProcessorTypes: [
            WasteProcessorType.CREMATION,
            WasteProcessorType.CREMATION
          ]
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    const updatedCompany = await prisma.company.findUnique({
      where: { id: company.id }
    });
    expect(updatedCompany).toMatchObject({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.CREMATION]
    });
  });

  it("if no longer waste processor, should remove waste processor types", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.CREMATION]
    });

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate<Pick<Mutation, "updateCompany">>(
      UPDATE_COMPANY,
      {
        variables: {
          id: company.id,
          companyTypes: [CompanyType.PRODUCER]
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    const updatedCompany = await prisma.company.findUnique({
      where: { id: company.id }
    });
    expect(updatedCompany).toMatchObject({
      companyTypes: [CompanyType.PRODUCER],
      wasteProcessorTypes: []
    });
  });

  it.each([null, undefined, []])(
    "user can manually remove waste processor types (value '%p')",
    async wasteProcessorTypes => {
      // Given
      const { user, company } = await userWithCompanyFactory("ADMIN", {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.CREMATION]
      });

      // When
      const { mutate } = makeClient({ ...user, auth: AuthType.Session });
      const { errors } = await mutate<Pick<Mutation, "updateCompany">>(
        UPDATE_COMPANY,
        {
          variables: {
            id: company.id,
            wasteProcessorTypes
          }
        }
      );

      // Then
      expect(errors).toBeUndefined();

      const updatedCompany = await prisma.company.findUnique({
        where: { id: company.id }
      });
      expect(updatedCompany).toMatchObject({
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: []
      });
    }
  );

  it("user can omit waste processor types (optional)", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.CREMATION]
    });

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate<Pick<Mutation, "updateCompany">>(
      UPDATE_COMPANY,
      {
        variables: {
          id: company.id,
          codeNaf: "0112Z"
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    const updatedCompany = await prisma.company.findUnique({
      where: { id: company.id }
    });
    expect(updatedCompany).toMatchObject({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.CREMATION]
    });
  });
});
