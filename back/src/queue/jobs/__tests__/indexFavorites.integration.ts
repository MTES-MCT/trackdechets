import { resetDatabase } from "../../../../integration-tests/helper";
import { AuthType } from "../../../auth";
import {
  userWithCompanyFactory,
  formFactory,
  companyFactory,
  siretify,
  formWithTempStorageFactory
} from "../../../__tests__/factories";
import { CompanySearchResult } from "../../../companies/types";
import getReadableId from "../../../forms/readableId";
import { searchCompany } from "../../../companies/search";
import { favoritesConstrutor } from "../indexFavorites";
import { getFormForElastic, indexForm } from "../../../forms/elastic";
import { index, client as elasticSearch } from "../../../common/elastic";
import makeClient from "../../../__tests__/testClient";
import { Mutation } from "../../../generated/graphql/types";

const mockUpdateFavorites = jest.fn();
const mockGetUpdatedCompanyNameAndAddress = jest.fn();
// Mock external search services
jest.mock("../../../companies/database", () => ({
  // https://www.chakshunyu.com/blog/how-to-mock-only-one-function-from-a-module-in-jest/
  ...jest.requireActual("../../../companies/database"),
  getUpdatedCompanyNameAndAddress: (...args) =>
    mockGetUpdatedCompanyNameAndAddress(...args),
  updateFavorites: (...args) => mockUpdateFavorites(...args)
}));

jest.mock("../../../companies/search");

async function refreshIndices() {
  await elasticSearch.indices.refresh(
    {
      index: index.alias
    },
    {
      // do not throw an error on version conflicts
      ignore: [409]
    }
  );
}

describe("Index favorites job", () => {
  afterEach(resetDatabase);
  beforeEach(() => {
    (searchCompany as jest.Mock).mockReset();
  });
  it("should ignore drafts", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["COLLECTOR"]
      }
    });
    const emitter = await companyFactory();
    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user.id,
          opt: {
            status: "DRAFT",
            emitterCompanySiret: emitter.orgId,
            recipientCompanySiret: company.orgId,
            recipientsSirets: [company.orgId!]
          }
        })
      )
    );
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      name: emitter.name,
      siret: emitter.siret,
      orgId: emitter.orgId,
      vatNumber: null,
      contact: emitter.contact,
      contactEmail: emitter.contactEmail,
      contactPhone: emitter.contactPhone,
      codePaysEtrangerEtablissement: "FR",
      address: emitter.address,
      companyTypes: emitter.companyTypes,
      isRegistered: true,
      etatAdministratif: "A",
      statutDiffusionEtablissement: "O"
    });
    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user.id,
          opt: {
            emitterCompanySiret: emitter.orgId,
            recipientCompanySiret: company.orgId,
            recipientsSirets: [company.orgId!]
          }
        })
      )
    );

    await refreshIndices();
    const favorites = await favoritesConstrutor({
      orgId: company.orgId,
      type: "EMITTER"
    });

    expect(favorites).toEqual([
      expect.objectContaining({
        name: emitter.name,
        siret: emitter.siret,
        orgId: emitter.orgId,
        vatNumber: null,
        contact: emitter.contact,
        contactEmail: emitter.contactEmail,
        contactPhone: emitter.contactPhone,
        codePaysEtrangerEtablissement: "FR",
        address: emitter.address,
        companyTypes: emitter.companyTypes,
        isRegistered: true,
        etatAdministratif: "A",
        statutDiffusionEtablissement: "O"
      })
    ]);
  });

  it("should ignore deleted forms", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["COLLECTOR"]
      }
    });
    const emitter = await companyFactory();
    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user.id,
          opt: {
            isDeleted: true,
            emitterCompanySiret: emitter.orgId,
            recipientCompanySiret: company.orgId,
            recipientsSirets: [company.orgId!]
          }
        })
      )
    );
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      name: emitter.name,
      siret: emitter.siret,
      orgId: emitter.orgId,
      vatNumber: null,
      contact: emitter.contact,
      contactEmail: emitter.contactEmail,
      contactPhone: emitter.contactPhone,
      codePaysEtrangerEtablissement: "FR",
      address: emitter.address,
      companyTypes: emitter.companyTypes,
      isRegistered: true,
      etatAdministratif: "A",
      statutDiffusionEtablissement: "O"
    });
    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user.id,
          opt: {
            emitterCompanySiret: emitter.orgId,
            recipientCompanySiret: company.orgId,
            recipientsSirets: [company.orgId!]
          }
        })
      )
    );
    await refreshIndices();
    const favorites = await favoritesConstrutor({
      orgId: company.orgId,
      type: "EMITTER"
    });

    expect(favorites).toEqual([
      expect.objectContaining({
        name: emitter.name,
        siret: emitter.siret,
        orgId: emitter.orgId,
        vatNumber: null,
        contact: emitter.contact,
        contactEmail: emitter.contactEmail,
        contactPhone: emitter.contactPhone,
        codePaysEtrangerEtablissement: "FR",
        address: emitter.address,
        companyTypes: emitter.companyTypes,
        isRegistered: true,
        etatAdministratif: "A",
        statutDiffusionEtablissement: "O"
      })
    ]);
  });

  it("should return recent emitters", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["COLLECTOR"]
      }
    });
    const emitter = await companyFactory();
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      name: emitter.name,
      siret: emitter.siret,
      orgId: emitter.orgId,
      vatNumber: null,
      contact: emitter.contact,
      contactEmail: emitter.contactEmail,
      contactPhone: emitter.contactPhone,
      codePaysEtrangerEtablissement: "FR",
      address: emitter.address,
      companyTypes: emitter.companyTypes,
      isRegistered: true,
      etatAdministratif: "A",
      statutDiffusionEtablissement: "O"
    });
    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user.id,
          opt: {
            emitterCompanySiret: emitter.orgId,
            recipientCompanySiret: company.orgId,
            recipientsSirets: [company.orgId!]
          }
        })
      )
    );
    await refreshIndices();

    const favorites = await favoritesConstrutor({
      orgId: company.orgId,
      type: "EMITTER"
    });

    expect(favorites).toEqual([
      expect.objectContaining({
        name: emitter.name,
        siret: emitter.siret,
        orgId: emitter.orgId,
        vatNumber: null,
        contact: emitter.contact,
        contactEmail: emitter.contactEmail,
        contactPhone: emitter.contactPhone,
        codePaysEtrangerEtablissement: "FR",
        address: emitter.address,
        companyTypes: emitter.companyTypes,
        isRegistered: true,
        etatAdministratif: "A",
        statutDiffusionEtablissement: "O"
      })
    ]);
  });

  it("should ignore emitters not registered in TD", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["COLLECTOR"]
      }
    });
    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user.id,
          opt: {
            emitterCompanySiret: siretify(1),
            recipientCompanySiret: company.orgId
          }
        })
      )
    );
    await refreshIndices();

    const favorites = await favoritesConstrutor({
      orgId: company.orgId,
      type: "EMITTER"
    });

    expect(favorites).toEqual([]);
  });

  it("should return recent recipients", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    const recipient = await companyFactory();
    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user.id,
          opt: {
            emitterCompanySiret: company.orgId,
            recipientCompanySiret: recipient.orgId
          }
        })
      )
    );

    (searchCompany as jest.Mock).mockResolvedValueOnce({
      name: recipient.name,
      siret: recipient.siret,
      orgId: recipient.orgId,
      vatNumber: null,
      contact: recipient.contact,
      contactEmail: recipient.contactEmail,
      contactPhone: recipient.contactPhone,
      codePaysEtrangerEtablissement: "FR",
      address: recipient.address,
      companyTypes: recipient.companyTypes,
      isRegistered: true,
      etatAdministratif: "A",
      statutDiffusionEtablissement: "O"
    });
    await refreshIndices();

    const favorites = await favoritesConstrutor({
      orgId: company.orgId,
      type: "RECIPIENT"
    });

    expect(favorites).toEqual([
      expect.objectContaining({
        name: recipient.name,
        siret: recipient.siret,
        orgId: recipient.orgId,
        vatNumber: null,
        contact: recipient.contact,
        contactEmail: recipient.contactEmail,
        contactPhone: recipient.contactPhone,
        codePaysEtrangerEtablissement: "FR",
        address: recipient.address,
        companyTypes: recipient.companyTypes,
        isRegistered: true,
        etatAdministratif: "A",
        statutDiffusionEtablissement: "O"
      })
    ]);
  });

  it("should ignore recipients not registered in TD", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user.id,
          opt: {
            emitterCompanySiret: company.orgId,
            recipientCompanySiret: siretify(1)
          }
        })
      )
    );
    await refreshIndices();

    const favorites = await favoritesConstrutor({
      orgId: company.orgId,
      type: "RECIPIENT"
    });

    expect(favorites).toEqual([]);
  });

  it("should return recent french transporters", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    const transporter = await companyFactory({
      companyTypes: {
        set: ["TRANSPORTER"]
      },
      transporterReceipt: {
        create: {
          receiptNumber: "receipt",
          validityLimit: new Date(),
          department: "07"
        }
      }
    });
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      name: transporter.name,
      siret: transporter.siret,
      orgId: transporter.orgId,
      vatNumber: null,
      contact: transporter.contact,
      contactEmail: transporter.contactEmail,
      contactPhone: transporter.contactPhone,
      codePaysEtrangerEtablissement: "FR",
      address: transporter.address,
      companyTypes: transporter.companyTypes,
      isRegistered: true,
      etatAdministratif: "A",
      statutDiffusionEtablissement: "O",
      transporterReceipt: expect.objectContaining({
        receiptNumber: "receipt"
      })
    });
    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user.id,
          opt: {
            emitterCompanySiret: company.orgId,
            transporters: {
              create: { transporterCompanySiret: transporter.orgId, number: 1 }
            }
          }
        })
      )
    );
    await refreshIndices();

    const favorites = await favoritesConstrutor({
      orgId: company.orgId,
      type: "TRANSPORTER"
    });

    expect(favorites).toEqual([
      expect.objectContaining({
        name: transporter.name,
        siret: transporter.siret,
        orgId: transporter.orgId,
        vatNumber: null,
        contact: transporter.contact,
        contactEmail: transporter.contactEmail,
        contactPhone: transporter.contactPhone,
        codePaysEtrangerEtablissement: "FR",
        address: transporter.address,
        companyTypes: transporter.companyTypes,
        isRegistered: true,
        etatAdministratif: "A",
        statutDiffusionEtablissement: "O",
        transporterReceipt: expect.objectContaining({
          receiptNumber: "receipt"
        })
      })
    ]);
  });

  it("should return recent UE transporters", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    const transporter = await companyFactory({
      siret: null,
      vatNumber: "IT09301420155",
      orgId: "IT09301420155"
    });
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      name: transporter.name,
      siret: null,
      vatNumber: transporter.vatNumber,
      orgId: transporter.orgId,
      contact: transporter.contact,
      contactEmail: transporter.contactEmail,
      contactPhone: transporter.contactPhone,
      codePaysEtrangerEtablissement: "IT",
      address: transporter.address,
      companyTypes: transporter.companyTypes,
      isRegistered: true,
      etatAdministratif: "A",
      statutDiffusionEtablissement: "O"
    });
    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user.id,
          opt: {
            emitterCompanySiret: company.orgId,
            transporters: {
              create: {
                transporterCompanyVatNumber: transporter.vatNumber,
                number: 1
              }
            }
          }
        })
      )
    );

    await refreshIndices();
    const favorites = await favoritesConstrutor({
      orgId: company.orgId,
      type: "TRANSPORTER"
    });

    expect(favorites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: transporter.name,
          siret: null,
          vatNumber: transporter.vatNumber,
          orgId: transporter.orgId,
          contact: transporter.contact,
          contactEmail: transporter.contactEmail,
          contactPhone: transporter.contactPhone,
          codePaysEtrangerEtablissement: "IT",
          address: transporter.address,
          companyTypes: transporter.companyTypes,
          isRegistered: true,
          etatAdministratif: "A",
          statutDiffusionEtablissement: "O"
        })
      ])
    );
  });

  it("should ignore transporters not registered in TD", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    const unknownSiret = siretify(1);
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      name: "name",
      siret: unknownSiret,
      vatNumber: null,
      orgId: unknownSiret,
      contact: "transporter.contact",
      contactEmail: "transporter.contactEmail",
      contactPhone: "transporter.contactPhone",
      codePaysEtrangerEtablissement: "FR",
      address: "transporter.address",
      isRegistered: false,
      etatAdministratif: "A",
      statutDiffusionEtablissement: "O"
    });
    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user.id,
          opt: {
            emitterCompanySiret: company.orgId,
            transporters: {
              create: {
                transporterCompanySiret: siretify(1),
                number: 1
              }
            }
          }
        })
      )
    );
    await refreshIndices();

    const favorites = await favoritesConstrutor({
      orgId: company.orgId,
      type: "TRANSPORTER"
    });

    expect(favorites).toEqual([]);
  });

  it("should return recent temporary storage", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    const tempStorer = await companyFactory();
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      name: tempStorer.name,
      siret: tempStorer.siret,
      vatNumber: tempStorer.vatNumber,
      orgId: tempStorer.orgId,
      contact: tempStorer.contact,
      contactEmail: tempStorer.contactEmail,
      contactPhone: tempStorer.contactPhone,
      codePaysEtrangerEtablissement: "FR",
      address: tempStorer.address,
      companyTypes: tempStorer.companyTypes,
      isRegistered: true,
      etatAdministratif: "A",
      statutDiffusionEtablissement: "O"
    });
    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user.id,
          opt: {
            emitterCompanySiret: company.orgId,
            recipientCompanySiret: tempStorer.orgId,
            recipientIsTempStorage: true
          }
        })
      )
    );
    await refreshIndices();

    const favorites = await favoritesConstrutor({
      orgId: company.orgId,
      type: "TEMPORARY_STORAGE_DETAIL"
    });

    expect(favorites).toEqual([
      expect.objectContaining({
        name: tempStorer.name,
        siret: tempStorer.siret,
        orgId: tempStorer.orgId,
        vatNumber: null,
        contact: tempStorer.contact,
        contactEmail: tempStorer.contactEmail,
        contactPhone: tempStorer.contactPhone,
        codePaysEtrangerEtablissement: "FR",
        address: tempStorer.address,
        companyTypes: tempStorer.companyTypes,
        isRegistered: true,
        etatAdministratif: "A",
        statutDiffusionEtablissement: "O"
      })
    ]);
  });

  it("should ignore temporary storage not registered in TD", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    const unknownSiret = siretify(1);
    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user.id,
          opt: {
            emitterCompanySiret: company.orgId,
            recipientCompanySiret: unknownSiret,
            recipientIsTempStorage: true
          }
        })
      )
    );

    (searchCompany as jest.Mock).mockResolvedValueOnce({
      name: "tempStorer.name",
      siret: unknownSiret,
      vatNumber: null,
      orgId: "tempStorer.orgId",
      contact: "tempStorer.contact",
      contactEmail: "tempStorer.contactEmail",
      contactPhone: "tempStorer.contactPhone",
      codePaysEtrangerEtablissement: "FR",
      address: "tempStorer.address",
      isRegistered: false,
      etatAdministratif: "A",
      statutDiffusionEtablissement: "O"
    });
    await refreshIndices();

    const favorites = await favoritesConstrutor({
      orgId: company.orgId,
      type: "TEMPORARY_STORAGE_DETAIL"
    });

    expect(favorites).toEqual([]);
  });

  it("should return recent destination after temporary storage", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    const destination = await companyFactory();

    await indexForm(
      await getFormForElastic(
        await formWithTempStorageFactory({
          ownerId: user.id,
          opt: {
            emitterCompanySiret: company.orgId,
            recipientsSirets: [destination.orgId!]
          },
          forwardedInOpts: { recipientCompanySiret: destination.orgId }
        })
      )
    );

    (searchCompany as jest.Mock).mockResolvedValueOnce({
      name: destination.name,
      siret: destination.siret,
      vatNumber: destination.vatNumber,
      orgId: destination.orgId,
      contact: destination.contact,
      contactEmail: destination.contactEmail,
      contactPhone: destination.contactPhone,
      codePaysEtrangerEtablissement: "FR",
      address: destination.address,
      companyTypes: destination.companyTypes,
      isRegistered: true,
      etatAdministratif: "A",
      statutDiffusionEtablissement: "O"
    });
    await refreshIndices();

    const favorites = await favoritesConstrutor({
      orgId: company.orgId,
      type: "DESTINATION"
    });

    expect(favorites).toEqual([
      expect.objectContaining({
        orgId: destination.orgId,
        siret: destination.siret,
        name: destination.name,
        address: destination.address,
        vatNumber: null,
        contact: destination.contact,
        contactEmail: destination.contactEmail,
        contactPhone: destination.contactPhone,
        codePaysEtrangerEtablissement: "FR",
        companyTypes: destination.companyTypes,
        isRegistered: true,
        etatAdministratif: "A",
        statutDiffusionEtablissement: "O"
      })
    ]);
  });

  it("should ignore destinations after temp storage not registered in TD", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    const recipientCompanySiret = siretify(1);

    await indexForm(
      await getFormForElastic(
        await formWithTempStorageFactory({
          ownerId: user.id,
          opt: { emitterCompanySiret: company.orgId },
          forwardedInOpts: { recipientCompanySiret }
        })
      )
    );

    (searchCompany as jest.Mock).mockResolvedValueOnce({
      name: "destination.name",
      siret: recipientCompanySiret,
      vatNumber: null,
      orgId: recipientCompanySiret,
      contact: "destination.contact",
      contactEmail: "destination.contactEmail",
      contactPhone: "destination.contactPhone",
      codePaysEtrangerEtablissement: "FR",
      address: "destination.address",
      isRegistered: false,
      etatAdministratif: "A",
      statutDiffusionEtablissement: "O"
    });
    await refreshIndices();

    const favorites = await favoritesConstrutor({
      orgId: company.orgId,
      type: "DESTINATION"
    });

    expect(favorites).toEqual([]);
  });

  it("should return recent next destinations", async () => {
    const orgId = siretify(1);
    const destination: CompanySearchResult = {
      orgId,
      siret: orgId,
      vatNumber: null,
      address: "rue des 4 chemins",
      name: "Destination ultérieure",
      isRegistered: true,
      companyTypes: ["WASTEPROCESSOR"],
      statutDiffusionEtablissement: "O",
      contactEmail: "contact@traiteur.co",
      contactPhone: "00 00 00 00 00",
      contact: "John Snow",
      codePaysEtrangerEtablissement: "FR",
      etatAdministratif: "A",
      isDormant: false
    };
    (searchCompany as jest.Mock).mockResolvedValueOnce(destination);

    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user.id,
          opt: {
            emitterCompanySiret: company.orgId,
            nextDestinationCompanySiret: destination.orgId
          }
        })
      )
    );
    await refreshIndices();

    const favorites = await favoritesConstrutor({
      orgId: company.orgId,
      type: "NEXT_DESTINATION"
    });

    expect(favorites).toEqual([
      expect.objectContaining({
        orgId: destination.orgId,
        siret: destination.siret,
        vatNumber: null,
        name: destination.name,
        address: destination.address,
        contactEmail: destination.contactEmail,
        contactPhone: destination.contactPhone,
        contact: destination.contact,
        codePaysEtrangerEtablissement: "FR",
        companyTypes: destination.companyTypes,
        isRegistered: true,
        etatAdministratif: "A",
        statutDiffusionEtablissement: "O"
      })
    ]);
  });

  it("should not return next destinations not present in SIRENE database", async () => {
    (searchCompany as jest.Mock).mockRejectedValueOnce("Entreprise inconnue");
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user.id,
          opt: {
            emitterCompanySiret: company.orgId,
            nextDestinationCompanySiret: siretify(1)
          }
        })
      )
    );
    await refreshIndices();

    const favorites = await favoritesConstrutor({
      orgId: company.orgId,
      type: "NEXT_DESTINATION"
    });

    expect(favorites).toEqual([]);
  });

  it("should return recent traders", async () => {
    const validityLimit = new Date();
    const trader = await companyFactory({
      companyTypes: ["TRADER"],
      traderReceipt: {
        create: {
          receiptNumber: "receipt",
          department: "07",
          validityLimit
        }
      }
    });

    const traderSirene: CompanySearchResult = {
      orgId: trader.orgId!,
      siret: trader.siret,
      vatNumber: null,
      address: "rue des 4 chemins",
      name: "Négociant",
      isRegistered: true,
      companyTypes: ["TRADER"],
      statutDiffusionEtablissement: "O",
      contactEmail: "contact@trader.co",
      contactPhone: "00 00 00 00 00",
      contact: "John Snow",
      etatAdministratif: "A",
      codePaysEtrangerEtablissement: "FR",
      isDormant: false
    };
    (searchCompany as jest.Mock).mockResolvedValueOnce(traderSirene);

    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user.id,
          opt: {
            emitterCompanySiret: company.orgId,
            traderCompanySiret: trader.orgId
          }
        })
      )
    );
    await refreshIndices();

    const favorites = await favoritesConstrutor({
      orgId: company.orgId,
      type: "TRADER"
    });

    expect(favorites).toEqual([
      expect.objectContaining({
        orgId: traderSirene.orgId,
        name: traderSirene.name,
        siret: trader.siret,
        address: traderSirene.address,
        vatNumber: null,
        contactEmail: traderSirene.contactEmail,
        contactPhone: traderSirene.contactPhone,
        contact: traderSirene.contact,
        codePaysEtrangerEtablissement: "FR",
        companyTypes: traderSirene.companyTypes,
        isRegistered: true,
        etatAdministratif: "A",
        statutDiffusionEtablissement: "O",
        traderReceipt: {
          receiptNumber: "receipt",
          department: "07",
          validityLimit,
          id: trader.traderReceiptId
        }
      })
    ]);
  });

  it("should return recent brokers", async () => {
    const validityLimit = new Date();
    const broker = await companyFactory({
      companyTypes: ["BROKER"],
      brokerReceipt: {
        create: {
          receiptNumber: "receipt",
          department: "07",
          validityLimit
        }
      }
    });

    const brokerSirene: CompanySearchResult = {
      orgId: broker.orgId,
      siret: broker.siret,
      vatNumber: null,
      address: "rue des 4 chemins",
      name: "Courtier",
      isRegistered: true,
      companyTypes: ["BROKER"],
      statutDiffusionEtablissement: "O",
      contactEmail: "contact@broker.co",
      contactPhone: "00 00 00 00 00",
      contact: "John Snow",
      etatAdministratif: "A",
      codePaysEtrangerEtablissement: "FR",
      isDormant: false
    };

    (searchCompany as jest.Mock).mockResolvedValueOnce(brokerSirene);

    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user.id,
          opt: {
            emitterCompanySiret: company.orgId,
            brokerCompanySiret: broker.orgId
          }
        })
      )
    );
    await refreshIndices();

    const favorites = await favoritesConstrutor({
      orgId: company.orgId,
      type: "BROKER"
    });

    expect(favorites).toEqual([
      expect.objectContaining({
        orgId: brokerSirene.orgId,
        siret: broker.siret,
        name: brokerSirene.name,
        address: brokerSirene.address,
        vatNumber: null,
        contactEmail: brokerSirene.contactEmail,
        contactPhone: brokerSirene.contactPhone,
        contact: brokerSirene.contact,
        codePaysEtrangerEtablissement: "FR",
        companyTypes: brokerSirene.companyTypes,
        isRegistered: true,
        etatAdministratif: "A",
        statutDiffusionEtablissement: "O",
        brokerReceipt: {
          receiptNumber: "receipt",
          department: "07",
          validityLimit,
          id: broker.brokerReceiptId
        }
      })
    ]);
  });

  it("should return the user's company if it matches the favorite type", async () => {
    const { company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId: company.orgId,
      siret: company.orgId!,
      vatNumber: null,
      address: "rue des 4 chemins",
      name: company.name,
      isRegistered: true,
      companyTypes: company.companyTypes,
      statutDiffusionEtablissement: "O",
      codePaysEtrangerEtablissement: "FR",
      contactEmail: company.contactEmail,
      contactPhone: company.contactPhone,
      contact: company.contact,
      etatAdministratif: "A"
    });
    await refreshIndices();
    const favorites = await favoritesConstrutor({
      orgId: company.orgId,
      type: "EMITTER"
    });
    expect(favorites).toEqual([
      expect.objectContaining({
        orgId: company.orgId,
        siret: company.siret,
        name: company.name,
        address: "rue des 4 chemins",
        vatNumber: null,
        contactEmail: company.contactEmail,
        contactPhone: company.contactPhone,
        contact: company.contact,
        codePaysEtrangerEtablissement: "FR",
        companyTypes: company.companyTypes,
        isRegistered: true,
        etatAdministratif: "A",
        statutDiffusionEtablissement: "O"
      })
    ]);
  });

  it("should return the user's company even if there are other results", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    const emitter1 = await companyFactory();
    const emitter2 = await companyFactory();
    const firstForm = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: emitter1.orgId,
        recipientCompanySiret: company.orgId
      }
    });
    const secondForm = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: emitter2.orgId,
        recipientCompanySiret: company.orgId
      }
    });
    await indexForm(await getFormForElastic(firstForm));
    await indexForm(await getFormForElastic(secondForm));
    await refreshIndices();

    (searchCompany as jest.Mock)
      .mockResolvedValueOnce({
        orgId: emitter1.orgId,
        siret: emitter1.siret,
        address: "rue des 4 chemins",
        name: emitter1.name,
        isRegistered: true,
        companyTypes: emitter1.companyTypes,
        statutDiffusionEtablissement: "O",
        contactEmail: emitter1.contactEmail,
        contactPhone: emitter1.contactPhone,
        contact: emitter1.contact
      })
      .mockResolvedValueOnce({
        orgId: emitter2.orgId,
        siret: emitter2.siret,
        address: "rue des 4 chemins",
        name: emitter2.name,
        isRegistered: true,
        companyTypes: emitter2.companyTypes,
        statutDiffusionEtablissement: "O",
        contactEmail: emitter2.contactEmail,
        contactPhone: emitter2.contactPhone,
        contact: emitter2.contact
      })
      .mockResolvedValueOnce({
        orgId: company.orgId,
        siret: company.siret,
        address: "rue des 4 chemins",
        name: company.name,
        isRegistered: true,
        companyTypes: company.companyTypes,
        statutDiffusionEtablissement: "O",
        contactEmail: company.contactEmail,
        contactPhone: company.contactPhone,
        contact: company.contact
      });

    const favorites = await favoritesConstrutor({
      orgId: company.orgId,
      type: "EMITTER"
    });

    expect(favorites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          orgId: firstForm.emitterCompanySiret,
          siret: firstForm.emitterCompanySiret,
          address: "rue des 4 chemins",
          name: emitter1.name,
          isRegistered: true,
          companyTypes: emitter1.companyTypes,
          statutDiffusionEtablissement: "O",
          contactEmail: emitter1.contactEmail,
          contactPhone: emitter1.contactPhone,
          contact: emitter1.contact
        }),
        expect.objectContaining({
          orgId: secondForm.emitterCompanySiret,
          siret: secondForm.emitterCompanySiret,
          address: "rue des 4 chemins",
          name: emitter2.name,
          isRegistered: true,
          companyTypes: emitter2.companyTypes,
          statutDiffusionEtablissement: "O",
          contactEmail: emitter2.contactEmail,
          contactPhone: emitter2.contactPhone,
          contact: emitter2.contact
        }),
        expect.objectContaining({
          orgId: company.orgId,
          siret: company.siret,
          address: "rue des 4 chemins",
          name: company.name,
          isRegistered: true,
          companyTypes: company.companyTypes,
          statutDiffusionEtablissement: "O",
          contactEmail: company.contactEmail,
          contactPhone: company.contactPhone,
          contact: company.contact
        })
      ])
    );
  });

  it("should return the user's company based on an existing BSD", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    const emitter1 = await companyFactory();
    const emitter2 = await companyFactory();

    const firstForm = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: emitter1.orgId,
        recipientCompanySiret: company.orgId
      }
    });
    const secondForm = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: emitter2.orgId,
        recipientCompanySiret: company.orgId
      }
    });
    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user.id,
          opt: {
            emitterCompanySiret: company.orgId
          }
        })
      )
    );
    await indexForm(await getFormForElastic(firstForm));
    await indexForm(await getFormForElastic(secondForm));
    await refreshIndices();

    (searchCompany as jest.Mock)
      .mockResolvedValueOnce({
        orgId: emitter1.orgId,
        siret: emitter1.siret,
        address: "rue des 4 chemins",
        name: emitter1.name,
        isRegistered: true,
        companyTypes: emitter1.companyTypes,
        statutDiffusionEtablissement: "O",
        contactEmail: emitter1.contactEmail,
        contactPhone: emitter1.contactPhone,
        contact: emitter1.contact
      })
      .mockResolvedValueOnce({
        orgId: emitter2.orgId,
        siret: emitter2.siret,
        address: "rue des 4 chemins",
        name: emitter2.name,
        isRegistered: true,
        companyTypes: emitter2.companyTypes,
        statutDiffusionEtablissement: "O",
        contactEmail: emitter2.contactEmail,
        contactPhone: emitter2.contactPhone,
        contact: emitter2.contact
      })
      .mockResolvedValueOnce({
        orgId: company.orgId,
        siret: company.siret,
        address: "rue des 4 chemins",
        name: company.name,
        isRegistered: true,
        companyTypes: company.companyTypes,
        statutDiffusionEtablissement: "O",
        contactEmail: company.contactEmail,
        contactPhone: company.contactPhone,
        contact: company.contact
      });

    const favorites = await favoritesConstrutor({
      orgId: company.orgId,
      type: "EMITTER"
    });
    expect(favorites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          orgId: firstForm.emitterCompanySiret,
          siret: firstForm.emitterCompanySiret,
          address: "rue des 4 chemins",
          name: emitter1.name,
          isRegistered: true,
          companyTypes: emitter1.companyTypes,
          statutDiffusionEtablissement: "O",
          contactEmail: emitter1.contactEmail,
          contactPhone: emitter1.contactPhone,
          contact: emitter1.contact
        }),
        expect.objectContaining({
          orgId: secondForm.emitterCompanySiret,
          siret: secondForm.emitterCompanySiret,
          address: "rue des 4 chemins",
          name: emitter2.name,
          isRegistered: true,
          companyTypes: emitter2.companyTypes,
          statutDiffusionEtablissement: "O",
          contactEmail: emitter2.contactEmail,
          contactPhone: emitter2.contactPhone,
          contact: emitter2.contact
        }),
        expect.objectContaining({
          orgId: company.orgId,
          siret: company.siret,
          address: "rue des 4 chemins",
          name: company.name,
          isRegistered: true,
          companyTypes: company.companyTypes,
          statutDiffusionEtablissement: "O",
          contactEmail: company.contactEmail,
          contactPhone: company.contactPhone,
          contact: company.contact
        })
      ])
    );
  });

  it("should not return the same emitter company twice", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    const emitter = await companyFactory();
    const firstForm = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanyName: "A Name",
        emitterCompanySiret: emitter.orgId,
        recipientsSirets: [company.orgId!]
      }
    });
    await indexForm(await getFormForElastic(firstForm));
    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user.id,
          opt: {
            emitterCompanyName: "Another Name",
            emitterCompanySiret: firstForm.emitterCompanySiret,
            recipientsSirets: [company.orgId!]
          }
        })
      )
    );
    await refreshIndices();

    (searchCompany as jest.Mock).mockResolvedValue({
      name: emitter.name,
      siret: emitter.siret,
      vatNumber: emitter.vatNumber,
      orgId: emitter.orgId,
      contact: emitter.contact,
      contactEmail: emitter.contactEmail,
      contactPhone: emitter.contactPhone,
      codePaysEtrangerEtablissement: "FR",
      address: emitter.address,
      companyTypes: emitter.companyTypes,
      isRegistered: true,
      etatAdministratif: "A",
      statutDiffusionEtablissement: "O"
    });

    const favorites = await favoritesConstrutor({
      orgId: company.orgId,
      type: "EMITTER"
    });

    expect(favorites).toEqual([
      expect.objectContaining({
        name: emitter.name,
        siret: firstForm.emitterCompanySiret,
        vatNumber: null,
        orgId: firstForm.emitterCompanySiret,
        contact: emitter.contact,
        contactEmail: emitter.contactEmail,
        contactPhone: emitter.contactPhone,
        address: emitter.address,
        companyTypes: emitter.companyTypes,
        isRegistered: true,
        etatAdministratif: "A",
        statutDiffusionEtablissement: "O",
        codePaysEtrangerEtablissement: "FR"
      })
    ]);
  });
  it("should not return the same foreign transporter company twice", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    const transporter = await companyFactory({
      siret: null,
      vatNumber: "IT09301420155",
      orgId: "IT09301420155"
    });
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      name: transporter.name,
      siret: null,
      vatNumber: transporter.vatNumber,
      orgId: transporter.orgId,
      contact: transporter.contact,
      contactEmail: transporter.contactEmail,
      contactPhone: transporter.contactPhone,
      codePaysEtrangerEtablissement: "IT",
      address: transporter.address,
      companyTypes: transporter.companyTypes,
      isRegistered: true,
      etatAdministratif: "A",
      statutDiffusionEtablissement: "O"
    });
    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user.id,
          opt: {
            emitterCompanySiret: company.orgId,
            transporters: {
              create: {
                transporterCompanyVatNumber: transporter.vatNumber,
                number: 1
              }
            }
          }
        })
      )
    );
    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user.id,
          opt: {
            emitterCompanySiret: company.orgId,
            transporters: {
              create: {
                transporterCompanyName: "Another Name",
                transporterCompanyVatNumber: transporter.vatNumber,
                number: 1
              }
            }
          }
        })
      )
    );
    await refreshIndices();

    const favorites = await favoritesConstrutor({
      orgId: company.orgId,
      type: "TRANSPORTER"
    });

    expect(favorites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: transporter.name,
          siret: null,
          vatNumber: transporter.vatNumber,
          orgId: transporter.orgId,
          contact: transporter.contact,
          contactEmail: transporter.contactEmail,
          contactPhone: transporter.contactPhone,
          codePaysEtrangerEtablissement: "IT",
          address: transporter.address,
          companyTypes: transporter.companyTypes,
          isRegistered: true,
          etatAdministratif: "A",
          statutDiffusionEtablissement: "O"
        })
      ])
    );
  });

  it("should suggest a temporary storage detail destination", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    const destination = await companyFactory();
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      name: destination.name,
      siret: null,
      vatNumber: destination.vatNumber,
      orgId: destination.orgId,
      contact: destination.contact,
      contactEmail: destination.contactEmail,
      contactPhone: destination.contactPhone,
      codePaysEtrangerEtablissement: "FR",
      address: destination.address,
      companyTypes: destination.companyTypes,
      isRegistered: true,
      etatAdministratif: "A",
      statutDiffusionEtablissement: "O"
    });
    const recipientCompanySiret = siretify(1);

    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user.id,
          opt: {
            emitterCompanySiret: company.orgId,
            recipientCompanySiret,
            recipientIsTempStorage: true,
            forwardedIn: {
              create: {
                readableId: getReadableId(),
                ownerId: user.id,
                recipientCompanySiret: destination.orgId
              }
            },
            recipientsSirets: [recipientCompanySiret, destination.orgId!]
          }
        })
      )
    );
    await refreshIndices();

    const favorites = await favoritesConstrutor({
      orgId: company.orgId,
      type: "DESTINATION"
    });
    expect(favorites).toEqual([
      expect.objectContaining({
        name: destination.name,
        siret: null,
        vatNumber: destination.vatNumber,
        orgId: destination.orgId,
        contact: destination.contact,
        contactEmail: destination.contactEmail,
        contactPhone: destination.contactPhone,
        codePaysEtrangerEtablissement: "FR",
        address: destination.address,
        companyTypes: destination.companyTypes,
        isRegistered: true,
        etatAdministratif: "A",
        statutDiffusionEtablissement: "O"
      })
    ]);
  });

  it("should return the modified company if it was updated", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    (searchCompany as jest.Mock).mockResolvedValue({
      orgId: company.orgId,
      siret: company.orgId!,
      vatNumber: null,
      address: "rue des 4 chemins",
      name: company.name,
      isRegistered: true,
      companyTypes: company.companyTypes,
      statutDiffusionEtablissement: "O",
      codePaysEtrangerEtablissement: "FR",
      contactEmail: company.contactEmail,
      contactPhone: company.contactPhone,
      contact: company.contact,
      etatAdministratif: "A"
    });
    await refreshIndices();
    const favorites = await favoritesConstrutor({
      orgId: company.orgId,
      type: "EMITTER"
    });
    expect(favorites).toEqual([
      expect.objectContaining({
        orgId: company.orgId,
        siret: company.siret,
        name: company.name,
        address: "rue des 4 chemins",
        vatNumber: null,
        contactEmail: company.contactEmail,
        contactPhone: company.contactPhone,
        contact: company.contact,
        codePaysEtrangerEtablissement: "FR",
        companyTypes: company.companyTypes,
        isRegistered: true,
        etatAdministratif: "A",
        statutDiffusionEtablissement: "O"
      })
    ]);

    const UPDATE_COMPANY = `
      mutation UpdateCompany(
        $id: String!,
        $gerepId: String,
        $contactEmail: String,
        $contactPhone: String,
        $website: String,
        $companyTypes: [CompanyType!],
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
          }
        }
    `;

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const variables = {
      id: company.id
    };

    mockGetUpdatedCompanyNameAndAddress.mockResolvedValueOnce({
      name: "nom de sirene",
      address: "l'adresse de sirene"
    });
    await mutate<Pick<Mutation, "updateCompany">>(UPDATE_COMPANY, {
      variables
    });
    expect(mockUpdateFavorites).toHaveBeenCalled();
  });
});
