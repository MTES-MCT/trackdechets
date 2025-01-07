import {
  CompanyType,
  WasteProcessorType,
  CollectorType,
  WasteVehiclesType
} from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { AuthType } from "../../../../auth";
import { TEST_COMPANY_PREFIX } from "@td/constants";
import { prisma } from "@td/prisma";
import type { Query } from "@td/codegen-back";

import {
  companyFactory,
  siretify,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { AnonymousCompanyError } from "../../../sirene/errors";

const mockSearchSirene = jest.fn();
jest.mock("../../../sirene/searchCompany", () => ({
  __esModule: true,
  default: (...args) => mockSearchSirene(...args)
}));

describe("query { companyPrivateInfos(clue: <SIRET>) }", () => {
  let query: ReturnType<typeof makeClient>["query"];

  beforeAll(async () => {
    const user = await userFactory();

    const testClient = makeClient({
      ...user,
      auth: AuthType.Session
    });
    query = testClient.query;
  });

  afterEach(async () => {
    await resetDatabase();
    mockSearchSirene.mockReset();
  });

  it("Random company not registered in Trackdéchets", async () => {
    const siret = siretify(1);

    mockSearchSirene.mockResolvedValueOnce({
      siret,
      etatAdministratif: "A",
      name: "CODE EN STOCK",
      address: "4 Boulevard Longchamp 13001 Marseille",
      codeCommune: "13201",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique",
      addressVoie: "4 boulevard Longchamp",
      addressCity: "Marseille",
      addressPostalCode: "13001"
    });

    const gqlquery = `
      query {
        companyPrivateInfos(clue: "${siret}") {
          siret
          isAnonymousCompany
          etatAdministratif
          name
          address
          naf
          libelleNaf
          isRegistered
          companyTypes
          wasteProcessorTypes
          collectorTypes
          contactEmail
          contactPhone
          website
          installation {
            codeS3ic
          }
        }
      }`;
    const response = await query<Pick<Query, "companyPrivateInfos">>(gqlquery);

    expect(response.data.companyPrivateInfos).toEqual({
      siret,
      etatAdministratif: "A",
      name: "CODE EN STOCK",
      address: "4 Boulevard Longchamp 13001 Marseille",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique",
      isRegistered: false,
      companyTypes: [],
      wasteProcessorTypes: [],
      collectorTypes: [],
      contactEmail: null,
      contactPhone: null,
      website: null,
      installation: null,
      isAnonymousCompany: false
    });
  });

  it("ICPE registered in Trackdéchets", async () => {
    const siret = siretify(1);

    mockSearchSirene.mockResolvedValueOnce({
      siret,
      etatAdministratif: "A",
      name: "CODE EN STOCK",
      address: "4 Boulevard Longchamp 13001 Marseille",
      codeCommune: "13201",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique",
      addressVoie: "4 boulevard Longchamp",
      addressCity: "Marseille",
      addressPostalCode: "13001"
    });

    await companyFactory({
      siret,
      name: "Code en Stock",
      contactEmail: "john.snow@trackdechets.fr",
      contactPhone: "0600000000",
      website: "https://trackdechets.beta.gouv.fr",
      companyTypes: {
        set: [CompanyType.WASTEPROCESSOR]
      },
      wasteProcessorTypes: {
        set: [WasteProcessorType.CREMATION]
      },
      collectorTypes: {
        set: [CollectorType.DANGEROUS_WASTES]
      },
      wasteVehiclesTypes: {
        set: [WasteVehiclesType.BROYEUR]
      }
    });

    await prisma.installation.create({
      data: {
        s3icNumeroSiret: siret,
        codeS3ic: "0064.00001"
      }
    });
    const gqlquery = `
      query {
        companyPrivateInfos(clue: "${siret}") {
          siret
          etatAdministratif
          name
          address
          naf
          libelleNaf
          isRegistered
          companyTypes
          wasteProcessorTypes
          collectorTypes
          wasteVehiclesTypes
          contactEmail
          contactPhone
          website
          installation {
            codeS3ic
          }
          isAnonymousCompany
        }
      }`;
    const response = await query<Pick<Query, "companyPrivateInfos">>(gqlquery);
    // informations from insee, TD and ICPE database are merged
    expect(response.data.companyPrivateInfos).toEqual({
      siret,
      etatAdministratif: "A",
      name: "CODE EN STOCK",
      address: "4 Boulevard Longchamp 13001 Marseille",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique",
      isRegistered: true,
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.CREMATION],
      collectorTypes: [CollectorType.DANGEROUS_WASTES],
      wasteVehiclesTypes: [WasteVehiclesType.BROYEUR],
      contactEmail: "john.snow@trackdechets.fr",
      contactPhone: "0600000000",
      website: "https://trackdechets.beta.gouv.fr",
      installation: {
        codeS3ic: "0064.00001"
      },
      isAnonymousCompany: false
    });
  });

  it("Transporter company with transporter receipt", async () => {
    const siret = siretify(9);
    mockSearchSirene.mockResolvedValueOnce({
      siret,
      etatAdministratif: "A",
      name: "CODE EN STOCK",
      address: "4 Boulevard Longchamp 13001 Marseille",
      codeCommune: "13201",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique",
      addressVoie: "4 boulevard Longchamp",
      addressCity: "Marseille",
      addressPostalCode: "13001"
    });

    const receipt = {
      receiptNumber: "receiptNumber",
      validityLimit: "2021-03-31T00:00:00.000Z",
      department: "07"
    };

    await companyFactory({
      siret,
      name: "Code en Stock",
      securityCode: 1234,
      contactEmail: "john.snow@trackdechets.fr",
      contactPhone: "0600000000",
      website: "https://trackdechets.beta.gouv.fr",
      transporterReceipt: { create: receipt }
    });

    const gqlquery = `
      query {
        companyPrivateInfos(clue: "${siret}") {
          siret
          isAnonymousCompany
          transporterReceipt {
            receiptNumber
            validityLimit
            department
          }
        }
      }`;
    const response = await query<Pick<Query, "companyPrivateInfos">>(gqlquery);
    expect(response.data.companyPrivateInfos.transporterReceipt).toEqual(
      receipt
    );
    expect(response.data.companyPrivateInfos.siret).toEqual(siret);
    expect(response.data.companyPrivateInfos.isAnonymousCompany).toBeFalsy();
  });

  it("Trader company with trader receipt", async () => {
    const siret = siretify(1);

    mockSearchSirene.mockResolvedValueOnce({
      siret,
      etatAdministratif: "A",
      name: "CODE EN STOCK",
      address: "4 Boulevard Longchamp 13001 Marseille",
      codeCommune: "13201",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique",
      addressVoie: "4 boulevard Longchamp",
      addressCity: "Marseille",
      addressPostalCode: "13001"
    });

    const receipt = {
      receiptNumber: "receiptNumber",
      validityLimit: "2021-03-31T00:00:00.000Z",
      department: "07"
    };

    await companyFactory({
      siret,
      name: "Code en Stock",
      securityCode: 1234,
      contactEmail: "john.snow@trackdechets.fr",
      contactPhone: "0600000000",
      website: "https://trackdechets.beta.gouv.fr",
      traderReceipt: { create: receipt }
    });

    const gqlquery = `
      query {
        companyPrivateInfos(clue: "${siret}") {
          traderReceipt {
            receiptNumber
            validityLimit
            department
          }
        }
      }`;
    const response = await query<Pick<Query, "companyPrivateInfos">>(gqlquery);
    expect(response.data.companyPrivateInfos.traderReceipt).toEqual(receipt);
  });

  it("Company with direct dasri takeover allowance", async () => {
    const siret = siretify(1);

    mockSearchSirene.mockResolvedValueOnce({
      siret,
      etatAdministratif: "A",
      name: "CODE EN STOCK",
      address: "4 Boulevard Longchamp 13001 Marseille",
      codeCommune: "13201",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique",
      addressVoie: "4 boulevard Longchamp",
      addressCity: "Marseille",
      addressPostalCode: "13001"
    });

    await companyFactory({
      siret,
      name: "Code en Stock",
      securityCode: 1234,
      contactEmail: "john.snow@trackdechets.fr",
      contactPhone: "0600000000",
      website: "https://trackdechets.beta.gouv.fr",
      allowBsdasriTakeOverWithoutSignature: true
    });

    const gqlquery = `
      query {
        companyPrivateInfos(clue: "${siret}") {
          allowBsdasriTakeOverWithoutSignature
          isRegistered
        }
      }`;
    const response = await query<Pick<Query, "companyPrivateInfos">>(gqlquery);
    expect(
      response.data.companyPrivateInfos.allowBsdasriTakeOverWithoutSignature
    ).toEqual(true);
    expect(response.data.companyPrivateInfos.isRegistered).toEqual(true);
  });

  it("Query companyPrivateInfos should not expose sensitive data to users who do not belong to company", async () => {
    const siret = siretify(1);

    mockSearchSirene.mockResolvedValueOnce({
      siret,
      etatAdministratif: "A",
      name: "CODE EN STOCK",
      address: "4 Boulevard Longchamp 13001 Marseille",
      codeCommune: "13201",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique",
      addressVoie: "4 boulevard Longchamp",
      addressCity: "Marseille",
      addressPostalCode: "13001"
    });

    const { company } = await userWithCompanyFactory("ADMIN", {
      siret,
      name: "Code en Stock",
      securityCode: 1234,
      contactEmail: "john.snow@trackdechets.fr",
      contactPhone: "0600000000",
      website: "https://trackdechets.beta.gouv.fr"
    });

    const otherCompany = await companyFactory();

    await prisma.signatureAutomation.create({
      data: {
        fromId: otherCompany.id,
        toId: company.id
      }
    });
    const user = await userFactory();
    const { query: thisQuery } = makeClient({
      ...user,
      auth: AuthType.Session
    });
    const gqlquery = `
      query {
        companyPrivateInfos(clue: "${siret}") {
          allowBsdasriTakeOverWithoutSignature
          securityCode
          users {
            email
          }
          receivedSignatureAutomations {id}
        }
      }`;

    const response = await thisQuery<Pick<Query, "companyPrivateInfos">>(
      gqlquery
    );

    expect(response.data.companyPrivateInfos.securityCode).toEqual(null);
    expect(
      response.data.companyPrivateInfos.receivedSignatureAutomations
    ).toEqual([]);
  });

  it("Query companyPrivateInfos should expose sensitive data to users who belong to company", async () => {
    const siret = siretify(1);

    mockSearchSirene.mockResolvedValueOnce({
      siret,
      etatAdministratif: "A",
      name: "CODE EN STOCK",
      address: "4 Boulevard Longchamp 13001 Marseille",
      codeCommune: "13201",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique",
      addressVoie: "4 boulevard Longchamp",
      addressCity: "Marseille",
      addressPostalCode: "13001"
    });

    const { user, company } = await userWithCompanyFactory("ADMIN", {
      siret,
      name: "Code en Stock",
      securityCode: 9543,
      contactEmail: "john.snow@trackdechets.fr",
      contactPhone: "0600000000",
      website: "https://trackdechets.beta.gouv.fr"
    });

    const otherCompany = await companyFactory({
      allowAppendix1SignatureAutomation: true
    });

    const signatureAutomation = await prisma.signatureAutomation.create({
      data: {
        fromId: otherCompany.id,
        toId: company.id
      }
    });
    const { query: thisQuery } = makeClient({
      ...user,
      auth: AuthType.Session
    });

    const gqlquery = `
      query {
        companyPrivateInfos(clue: "${siret}") {
          securityCode
            receivedSignatureAutomations {
              id
            }
        }
      }`;

    const response = await thisQuery<Pick<Query, "companyPrivateInfos">>(
      gqlquery
    );
    expect(response.data.companyPrivateInfos.securityCode).toEqual(9543);
    expect(
      response.data.companyPrivateInfos.receivedSignatureAutomations
    ).toEqual([{ id: signatureAutomation.id }]);
  });

  it("Query companyPrivateInfos should expose sensitive data if user is a Trackdéchets staff admin", async () => {
    const siret = siretify(1);

    mockSearchSirene.mockResolvedValueOnce({
      siret,
      etatAdministratif: "A",
      name: "CODE EN STOCK",
      address: "4 Boulevard Longchamp 13001 Marseille",
      codeCommune: "13201",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique",
      addressVoie: "4 boulevard Longchamp",
      addressCity: "Marseille",
      addressPostalCode: "13001"
    });

    const user = await userFactory({ isAdmin: true });

    const { user: companyMember } = await userWithCompanyFactory("ADMIN", {
      siret,
      name: "Code en Stock",
      securityCode: 1234,
      contactEmail: "john.snow@trackdechets.fr",
      contactPhone: "0600000000",
      website: "https://trackdechets.beta.gouv.fr"
    });

    const { query: thisQuery } = makeClient({
      ...user,
      auth: AuthType.Session
    });
    const gqlquery = `
      query {
        companyPrivateInfos(clue: "${siret}") {
            securityCode
          users {email}
        }
      }`;

    const response = await thisQuery<Pick<Query, "companyPrivateInfos">>(
      gqlquery
    );

    expect(response.data.companyPrivateInfos.users).toEqual([
      { email: companyMember.email }
    ]);
  });

  it("Closed company in INSEE public data", async () => {
    const siret = siretify(1);

    mockSearchSirene.mockResolvedValueOnce({
      siret,
      etatAdministratif: "F",
      name: "OPTIQUE LES AIX",
      address: "49 Rue de la République 18220 Les Aix-d'Angillon"
    });
    const gqlquery = `
    query {
      companyPrivateInfos(clue: "${siret}") {
        siret
        etatAdministratif
        name
        address
        naf
        libelleNaf
        isRegistered
        contactEmail
        contactPhone
        website
        installation {
          codeS3ic
        }
      }
    }`;
    const response = await query<Pick<Query, "companyPrivateInfos">>(gqlquery);
    const company = response.data.companyPrivateInfos;
    const expected = {
      siret,
      etatAdministratif: "F",
      name: "OPTIQUE LES AIX",
      address: "49 Rue de la République 18220 Les Aix-d'Angillon",
      isRegistered: false,
      contactEmail: null,
      contactPhone: null,
      installation: null,
      naf: null,
      libelleNaf: null,
      website: null
    };
    expect(company).toEqual(expected);
  });

  it("Hidden company in INSEE and not registered", async () => {
    const siret = siretify(1);

    mockSearchSirene.mockRejectedValueOnce(new AnonymousCompanyError());
    const gqlquery = `
      query {
        companyPrivateInfos(clue: "${siret}") {
          siret
          etatAdministratif
          name
          address
          naf
          libelleNaf
          isRegistered
          statutDiffusionEtablissement
          contactEmail
          contactPhone
          website
          installation {
            codeS3ic
          }
        }
      }`;
    const { data } = await query<Pick<Query, "companyPrivateInfos">>(gqlquery);
    expect(data.companyPrivateInfos).toMatchObject({
      address: null,
      contactEmail: null,
      contactPhone: null,
      etatAdministratif: "A",
      installation: null,
      isRegistered: false,
      statutDiffusionEtablissement: "P",
      libelleNaf: null,
      naf: null,
      name: null,
      siret,
      website: null
    });
  });

  it("Hidden company in INSEE and but registered without AnonymousCompany", async () => {
    const siret = siretify(1);

    mockSearchSirene.mockRejectedValueOnce(new AnonymousCompanyError());
    const company = await companyFactory({
      siret,
      name: "Code en Stock",
      contactEmail: "john.snow@trackdechets.fr",
      contactPhone: "0600000000",
      website: "https://trackdechets.beta.gouv.fr",
      companyTypes: {
        set: [CompanyType.WASTEPROCESSOR]
      }
    });
    const gqlquery = `
      query {
        companyPrivateInfos(clue: "${siret}") {
          siret
          etatAdministratif
          name
          address
          naf
          libelleNaf
          isRegistered
          statutDiffusionEtablissement
          isAnonymousCompany
          contactEmail
          contactPhone
          website
          companyTypes
        }
      }`;
    const { data } = await query<Pick<Query, "companyPrivateInfos">>(gqlquery);
    expect(data.companyPrivateInfos).toMatchObject({
      siret: company.siret,
      name: company.name,
      contactEmail: company.contactEmail,
      contactPhone: company.contactPhone,
      website: company.website,
      companyTypes: [CompanyType.WASTEPROCESSOR],
      etatAdministratif: "A",
      isRegistered: true,
      statutDiffusionEtablissement: "P",
      isAnonymousCompany: false,
      libelleNaf: null,
      naf: null
    });
  });

  it("Hidden company in INSEE, AnonymousCompany created and but not registered", async () => {
    const siret = siretify(5);

    const createInput = {
      siret,
      orgId: siret,
      name: "Établissement de test",
      address: "Adresse test",
      codeNaf: "XXXXX",
      libelleNaf: "Entreprise de test",
      codeCommune: "00000"
    };
    const anoCompany = await prisma.anonymousCompany.create({
      data: createInput
    });
    const gqlquery = `
      query {
        companyPrivateInfos(clue: "${siret}") {
          siret
          etatAdministratif
          name
          address
          naf
          libelleNaf
          isRegistered
          statutDiffusionEtablissement
          isAnonymousCompany
          contactEmail
          contactPhone
          website
        }
      }`;
    const { data } = await query<Pick<Query, "companyPrivateInfos">>(gqlquery);
    expect(data.companyPrivateInfos).toMatchObject({
      siret: anoCompany.siret,
      name: anoCompany.name,
      address: anoCompany.address,
      libelleNaf: anoCompany.libelleNaf,
      etatAdministratif: "A",
      isRegistered: false,
      statutDiffusionEtablissement: "P",
      isAnonymousCompany: true
    });
  });

  it("Hidden company in INSEE, AnonymousCompany for Test is created and but not registered", async () => {
    const siret = TEST_COMPANY_PREFIX + "12345698";

    const createInput = {
      siret,
      orgId: siret,
      name: "Établissement de test",
      address: "Adresse test",
      codeNaf: "XXXXX",
      libelleNaf: "Entreprise de test",
      codeCommune: "00000"
    };
    const anoCompany = await prisma.anonymousCompany.create({
      data: createInput
    });
    const gqlquery = `
      query {
        companyPrivateInfos(clue: "${siret}") {
          orgId
          siret
          etatAdministratif
          name
          address
          naf
          libelleNaf
          isRegistered
          statutDiffusionEtablissement
          isAnonymousCompany
          contactEmail
          contactPhone
          website
        }
      }`;
    const { data } = await query<Pick<Query, "companyPrivateInfos">>(gqlquery);
    expect(data.companyPrivateInfos).toMatchObject({
      orgId: anoCompany.orgId,
      siret: anoCompany.siret,
      name: anoCompany.name,
      address: anoCompany.address,
      libelleNaf: anoCompany.libelleNaf,
      etatAdministratif: "A",
      isRegistered: false,
      statutDiffusionEtablissement: "O",
      isAnonymousCompany: true
    });
  });

  it("Hidden company in INSEE, AnonymousCompany created and registered", async () => {
    const siret = siretify(1);

    const createInput = {
      siret,
      orgId: siret,
      name: "Établissement de test",
      address: "Adresse test",
      codeNaf: "XXXXX",
      libelleNaf: "Entreprise de test",
      codeCommune: "00000",
      vatNumber: "IT123"
    };
    await prisma.anonymousCompany.create({
      data: createInput
    });
    const company = await companyFactory({
      siret: createInput.siret,
      name: createInput.name,
      address: createInput.address
    });
    const gqlquery = `
      query {
        companyPrivateInfos(clue: "${siret}") {
          siret
          vatNumber
          etatAdministratif
          name
          address
          naf
          libelleNaf
          isRegistered
          statutDiffusionEtablissement
          isAnonymousCompany
          contactEmail
          contactPhone
          website
          installation {
            codeS3ic
          }
        }
      }`;
    const { data } = await query<Pick<Query, "companyPrivateInfos">>(gqlquery);
    expect(data.companyPrivateInfos).toMatchObject({
      address: company.address,
      name: company.name,
      siret: company.siret,
      vatNumber: createInput.vatNumber,
      contactEmail: company.contactEmail,
      contactPhone: company.contactPhone,
      website: company.website,
      installation: null,
      libelleNaf: createInput.libelleNaf,
      etatAdministratif: "A",
      isRegistered: true,
      statutDiffusionEtablissement: "P",
      isAnonymousCompany: true
    });
  });

  it("Hidden company in INSEE, AnonymousCompany for TEST created and registered", async () => {
    const siret = TEST_COMPANY_PREFIX + "12345698";

    const createInput = {
      siret,
      orgId: siret,
      name: "Établissement de test",
      address: "Adresse test",
      codeNaf: "XXXXX",
      libelleNaf: "Entreprise de test",
      codeCommune: "00000"
    };
    await prisma.anonymousCompany.create({
      data: createInput
    });
    const company = await companyFactory({
      siret: createInput.siret,
      name: createInput.name,
      address: createInput.address
    });
    const gqlquery = `
      query {
        companyPrivateInfos(clue: "${siret}") {
          orgId
          siret
          vatNumber
          etatAdministratif
          name
          address
          naf
          libelleNaf
          isRegistered
          statutDiffusionEtablissement
          isAnonymousCompany
          contactEmail
          contactPhone
          website
          installation {
            codeS3ic
          }
        }
      }`;
    const { data } = await query<Pick<Query, "companyPrivateInfos">>(gqlquery);
    expect(data.companyPrivateInfos).toMatchObject({
      orgId: company.orgId,
      address: company.address,
      name: company.name,
      siret: company.siret,
      contactEmail: company.contactEmail,
      contactPhone: company.contactPhone,
      website: company.website,
      installation: null,
      libelleNaf: createInput.libelleNaf,
      etatAdministratif: "A",
      isRegistered: true,
      statutDiffusionEtablissement: "O",
      isAnonymousCompany: true
    });
  });
});
