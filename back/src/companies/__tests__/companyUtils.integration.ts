import { CompanyType } from "@prisma/client";
import { resetDatabase } from "../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../__tests__/factories";
import { getCompanySplittedAddress } from "../companyUtils";

describe("getCompanySplittedAddress", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  it("should return company's splitted address (FR)", async () => {
    // Given
    const { company } = await userWithCompanyFactory("ADMIN", {
      name: "Acme FR",
      address: "4 boulevard Pasteur 44100 Nantes"
    });

    const companySearch = {
      orgId: company.orgId,
      siret: company.orgId,
      etatAdministratif: "A",
      addressVoie: "72 rue du Barbâtre",
      addressPostalCode: "37100",
      addressCity: "Reims",
      codePaysEtrangerEtablissement: ""
    };

    // When
    const splittedAddress = getCompanySplittedAddress(companySearch, company);

    // Then
    expect(splittedAddress?.street).toBe("72 rue du Barbâtre");
    expect(splittedAddress?.postalCode).toBe("37100");
    expect(splittedAddress?.city).toBe("Reims");
    expect(splittedAddress?.country).toBe("FR");
  });

  it("should return company's splitted address (foreign)", async () => {
    // Given
    const { company } = await userWithCompanyFactory("ADMIN", {
      vatNumber: "BE0894129667",
      orgId: "BE0894129667",
      name: "Acme BE",
      address: "Rue Bois de Goesnes 4 4570 Marchin",
      companyTypes: [CompanyType.TRANSPORTER]
    });

    const companySearch = {
      orgId: "BE0894129667",
      vatNumber: "BE0894129667",
      etatAdministratif: "A",
      addressVoie: "",
      addressPostalCode: "",
      addressCity: "",
      codePaysEtrangerEtablissement: "BE"
    };

    // When
    const splittedAddress = getCompanySplittedAddress(companySearch, company);

    // Then
    expect(splittedAddress?.street).toBe("Rue Bois de Goesnes 4");
    expect(splittedAddress?.postalCode).toBe("4570");
    expect(splittedAddress?.city).toBe("Marchin");
    expect(splittedAddress?.country).toBe("BE");
  });

  it("companySearch is empty > should update with company's address manual split", async () => {
    // Given
    const { company } = await userWithCompanyFactory("ADMIN", {
      name: "Acme FR",
      vatNumber: null,
      address: "4 boulevard Pasteur 44100 Nantes"
    });

    const companySearch = {
      orgId: company.orgId,
      siret: company.orgId,
      etatAdministratif: "A",
      codePaysEtrangerEtablissement: ""
    };

    // When
    const splittedAddress = getCompanySplittedAddress(companySearch, company);

    // Then
    expect(splittedAddress?.street).toBe("4 boulevard Pasteur");
    expect(splittedAddress?.postalCode).toBe("44100");
    expect(splittedAddress?.city).toBe("Nantes");
    expect(splittedAddress?.country).toBe("FR");
  });

  it("aberrant address > should return null", async () => {
    // Given
    const { company } = await userWithCompanyFactory("ADMIN", {
      name: "Acme FR",
      vatNumber: null,
      address: "Adresse test"
    });

    const companySearch = {
      orgId: company.orgId,
      siret: company.orgId,
      etatAdministratif: "A",
      codePaysEtrangerEtablissement: ""
    };

    // When
    const splittedAddress = getCompanySplittedAddress(companySearch, company);

    // Then
    expect(splittedAddress?.street).toBe(null);
    expect(splittedAddress?.postalCode).toBe(null);
    expect(splittedAddress?.city).toBe(null);
    expect(splittedAddress?.country).toBe(null);
  });

  it.each([null, undefined, {}])(
    "companySearch is %p > should do manual split",
    async companySearch => {
      // Given
      const { company } = await userWithCompanyFactory("ADMIN", {
        name: "Acme FR",
        vatNumber: null,
        address: "4 boulevard pasteur 44100 Nantes"
      });

      // When
      const splittedAddress = getCompanySplittedAddress(companySearch, company);

      // Then
      expect(splittedAddress?.street).toBe("4 boulevard pasteur");
      expect(splittedAddress?.postalCode).toBe("44100");
      expect(splittedAddress?.city).toBe("Nantes");
      expect(splittedAddress?.country).toBe("FR");
    }
  );

  it("partial addresses with no street > should return postalCode and city (API split)", async () => {
    // Given
    const { company } = await userWithCompanyFactory("ADMIN", {
      name: "Acme FR",
      vatNumber: null,
      address: "48170 CHAUDEYRAC"
    });

    const companySearch = {
      orgId: company.orgId,
      siret: company.orgId,
      etatAdministratif: "A",
      addressVoie: "",
      addressPostalCode: "48170",
      addressCity: "CHAUDEYRAC",
      codePaysEtrangerEtablissement: ""
    };

    // When
    const splittedAddress = getCompanySplittedAddress(companySearch, company);

    // Then
    expect(splittedAddress?.street).toBe("");
    expect(splittedAddress?.postalCode).toBe("48170");
    expect(splittedAddress?.city).toBe("CHAUDEYRAC");
    expect(splittedAddress?.country).toBe("FR");
  });

  it("companySearch contains [ND] > should do manual split", async () => {
    // Given
    const { company } = await userWithCompanyFactory("ADMIN", {
      name: "Acme FR",
      vatNumber: null,
      address: "4 boulevard pasteur 44100 Nantes"
    });

    const companySearch = {
      orgId: company.orgId,
      siret: company.orgId,
      etatAdministratif: "A",
      addressVoie: "[ND][ND][ND][ND][ND]",
      addressPostalCode: "[ND]",
      addressCity: "Nantes",
      codePaysEtrangerEtablissement: ""
    };

    // When
    const splittedAddress = getCompanySplittedAddress(companySearch, company);

    // Then
    expect(splittedAddress?.street).toBe("4 boulevard pasteur");
    expect(splittedAddress?.postalCode).toBe("44100");
    expect(splittedAddress?.city).toBe("Nantes");
    expect(splittedAddress?.country).toBe("FR");
  });
});
