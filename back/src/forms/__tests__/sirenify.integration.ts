import { CompanySearchResult } from "../../companies/types";
import { userFactory, userWithCompanyFactory } from "../../__tests__/factories";
import { searchCompany } from "../../companies/search";
import {
  CreateFormInput,
  ResealedFormInput
} from "../../generated/graphql/types";
import {
  sirenifyFormCreateInput,
  sirenifyFormInput,
  sirenifyResealedFormInput
} from "../sirenify";
import { AuthType } from "../../auth";
import { resetDatabase } from "../../../integration-tests/helper";
import { EmitterType, Prisma, Status } from "@prisma/client";
import ecoOrganisme from "../../bsdasris/examples/workflows/ecoOrganisme";

jest.mock("../../companies/search");

describe("sirenifyFormInput", () => {
  afterEach(resetDatabase);

  it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` are provided", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const recipient = await userWithCompanyFactory("MEMBER");
    const broker = await userWithCompanyFactory("MEMBER");
    const trader = await userWithCompanyFactory("MEMBER");
    const exutoire = await userWithCompanyFactory("MEMBER");
    const intermediary1 = await userWithCompanyFactory("MEMBER");
    const intermediary2 = await userWithCompanyFactory("MEMBER");

    function searchResult(companyName: string) {
      return {
        name: companyName,
        address: `Adresse ${companyName}`,
        statutDiffusionEtablissement: "O"
      } as CompanySearchResult;
    }

    const searchResults = {
      [emitter.company.siret!]: searchResult("émetteur"),
      [transporter.company.siret!]: searchResult("transporteur"),
      [recipient.company.siret!]: searchResult("destinataire"),
      [broker.company.siret!]: searchResult("courtier"),
      [trader.company.siret!]: searchResult("négociant"),
      [exutoire.company.siret!]: searchResult("destinataire final"),
      [intermediary1.company.siret!]: searchResult("intermédiaire 1"),
      [intermediary2.company.siret!]: searchResult("intermédiaire 2")
    };

    (searchCompany as jest.Mock).mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
    });

    const formInput: CreateFormInput = {
      emitter: {
        company: {
          siret: emitter.company.siret,
          name: "N'importe",
          address: "Nawak"
        }
      },
      transporter: {
        company: {
          siret: transporter.company.siret,
          name: "N'importe",
          address: "Nawak"
        }
      },
      recipient: {
        isTempStorage: true,
        company: {
          siret: recipient.company.siret,
          name: "N'importe",
          address: "Nawak"
        }
      },
      broker: {
        company: {
          siret: broker.company.siret,
          name: "N'importe",
          address: "Nawak"
        }
      },
      trader: {
        company: { siret: trader.company.siret }
      },
      intermediaries: [
        {
          siret: intermediary1.company.siret,
          contact: "Mr intermédiaire 1",
          name: "N'importe",
          address: "Nawak"
        },
        {
          siret: intermediary2.company.siret,
          contact: "Mr intermédiaire 2",
          name: "N'importe",
          address: "Nawak"
        }
      ],
      temporaryStorageDetail: {
        destination: {
          company: {
            siret: exutoire.company.siret,
            name: "N'importe",
            address: "Nawak"
          }
        }
      }
    };

    const sirenified = await sirenifyFormInput(formInput, {
      email: "john.snow@trackdechets.fr",
      auth: AuthType.Bearer
    } as Express.User);

    expect(sirenified.emitter!.company!.name).toEqual(
      searchResults[emitter.company.siret!].name
    );
    expect(sirenified.emitter!.company!.address).toEqual(
      searchResults[emitter.company.siret!].address
    );
    expect(sirenified.transporter!.company!.name).toEqual(
      searchResults[transporter.company.siret!].name
    );
    expect(sirenified.transporter!.company!.address).toEqual(
      searchResults[transporter.company.siret!].address
    );
    expect(sirenified.recipient!.company!.name).toEqual(
      searchResults[recipient.company.siret!].name
    );
    expect(sirenified.recipient!.company!.address).toEqual(
      searchResults[recipient.company.siret!].address
    );
    expect(sirenified.broker!.company!.name).toEqual(
      searchResults[broker.company.siret!].name
    );
    expect(sirenified.broker!.company!.address).toEqual(
      searchResults[broker.company.siret!].address
    );
    expect(sirenified.trader!.company!.name).toEqual(
      searchResults[trader.company.siret!].name
    );
    expect(sirenified.trader!.company!.address).toEqual(
      searchResults[trader.company.siret!].address
    );
    expect(
      sirenified.temporaryStorageDetail!.destination!.company!.name
    ).toEqual(searchResults[exutoire.company.siret!].name);
    expect(
      sirenified.temporaryStorageDetail!.destination!.company!.address
    ).toEqual(searchResults[exutoire.company.siret!].address);
    expect(sirenified.intermediaries![0].name).toEqual(
      searchResults[intermediary1.company.siret!].name
    );
    expect(sirenified.intermediaries![0].address).toEqual(
      searchResults[intermediary1.company.siret!].address
    );
    expect(sirenified.intermediaries![1].name).toEqual(
      searchResults[intermediary2.company.siret!].name
    );
    expect(sirenified.intermediaries![1].address).toEqual(
      searchResults[intermediary2.company.siret!].address
    );
  });

  it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` is not provided", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const recipient = await userWithCompanyFactory("MEMBER");
    const broker = await userWithCompanyFactory("MEMBER");
    const trader = await userWithCompanyFactory("MEMBER");
    const exutoire = await userWithCompanyFactory("MEMBER");
    const intermediary1 = await userWithCompanyFactory("MEMBER");
    const intermediary2 = await userWithCompanyFactory("MEMBER");

    function searchResult(companyName: string) {
      return {
        name: companyName,
        address: `Adresse ${companyName}`,
        statutDiffusionEtablissement: "O"
      } as CompanySearchResult;
    }

    const searchResults = {
      [emitter.company.siret!]: searchResult("émetteur"),
      [transporter.company.siret!]: searchResult("transporteur"),
      [recipient.company.siret!]: searchResult("destinataire"),
      [broker.company.siret!]: searchResult("courtier"),
      [trader.company.siret!]: searchResult("négociant"),
      [exutoire.company.siret!]: searchResult("destinataire final"),
      [intermediary1.company.siret!]: searchResult("intermédiaire 1"),
      [intermediary2.company.siret!]: searchResult("intermédiaire 2")
    };

    (searchCompany as jest.Mock).mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
    });

    const formInput: CreateFormInput = {
      emitter: {
        company: {
          siret: emitter.company.siret
        }
      },
      transporter: {
        company: {
          siret: transporter.company.siret
        }
      },
      recipient: {
        isTempStorage: true,
        company: {
          siret: recipient.company.siret
        }
      },
      broker: {
        company: {
          siret: broker.company.siret
        }
      },
      trader: {
        company: { siret: trader.company.siret }
      },
      intermediaries: [
        {
          siret: intermediary1.company.siret,
          contact: "Mr intermédiaire 1"
        },
        {
          siret: intermediary2.company.siret,
          contact: "Mr intermédiaire 2"
        }
      ],
      temporaryStorageDetail: {
        destination: {
          company: {
            siret: exutoire.company.siret
          }
        }
      }
    };

    const sirenified = await sirenifyFormInput(formInput, {
      email: "john.snow@trackdechets.fr",
      auth: AuthType.Bearer
    } as Express.User);

    expect(sirenified.emitter!.company!.name).toEqual(
      searchResults[emitter.company.siret!].name
    );
    expect(sirenified.emitter!.company!.address).toEqual(
      searchResults[emitter.company.siret!].address
    );
    expect(sirenified.transporter!.company!.name).toEqual(
      searchResults[transporter.company.siret!].name
    );
    expect(sirenified.transporter!.company!.address).toEqual(
      searchResults[transporter.company.siret!].address
    );
    expect(sirenified.recipient!.company!.name).toEqual(
      searchResults[recipient.company.siret!].name
    );
    expect(sirenified.recipient!.company!.address).toEqual(
      searchResults[recipient.company.siret!].address
    );
    expect(sirenified.broker!.company!.name).toEqual(
      searchResults[broker.company.siret!].name
    );
    expect(sirenified.broker!.company!.address).toEqual(
      searchResults[broker.company.siret!].address
    );
    expect(sirenified.trader!.company!.name).toEqual(
      searchResults[trader.company.siret!].name
    );
    expect(sirenified.trader!.company!.address).toEqual(
      searchResults[trader.company.siret!].address
    );
    expect(
      sirenified.temporaryStorageDetail!.destination!.company!.name
    ).toEqual(searchResults[exutoire.company.siret!].name);
    expect(
      sirenified.temporaryStorageDetail!.destination!.company!.address
    ).toEqual(searchResults[exutoire.company.siret!].address);
    expect(sirenified.intermediaries![0].name).toEqual(
      searchResults[intermediary1.company.siret!].name
    );
    expect(sirenified.intermediaries![0].address).toEqual(
      searchResults[intermediary1.company.siret!].address
    );
    expect(sirenified.intermediaries![1].name).toEqual(
      searchResults[intermediary2.company.siret!].name
    );
    expect(sirenified.intermediaries![1].address).toEqual(
      searchResults[intermediary2.company.siret!].address
    );
  });

  it("should overwrite `name` and `address` if company is not diffusible but registered in Trackdéchets", async () => {
    const emitter = await userWithCompanyFactory("MEMBER", {
      siret: "90398556200011",
      orgId: "90398556200011"
    });

    function searchResult(companyName: string) {
      return {
        name: companyName,
        address: `Adresse ${companyName}`,
        statutDiffusionEtablissement: "N",
        isRegistered: true
      } as CompanySearchResult;
    }

    const searchResults = {
      [emitter.company.siret!]: searchResult("émetteur")
    };

    (searchCompany as jest.Mock).mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
    });

    const formInput: CreateFormInput = {
      emitter: {
        company: {
          siret: "90398556200011"
        }
      }
    };

    const sirenified = await sirenifyFormInput(formInput, {
      email: "john.snow@trackdechets.fr",
      auth: AuthType.Bearer
    } as Express.User);

    expect(sirenified).toMatchObject({
      emitter: {
        company: {
          name: "émetteur",
          address: "Adresse émetteur",
          siret: "90398556200011"
        }
      }
    });
  });
});

describe("sirenifyResealedFormInput", () => {
  afterEach(resetDatabase);

  it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` are provided", async () => {
    const transporter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");

    function searchResult(companyName: string) {
      return {
        name: companyName,
        address: `Adresse ${companyName}`,
        statutDiffusionEtablissement: "O"
      } as CompanySearchResult;
    }

    const searchResults = {
      [transporter.company.siret!]: searchResult("transporteur"),
      [destination.company.siret!]: searchResult("destination")
    };

    (searchCompany as jest.Mock).mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
    });

    const resealedFormInput: ResealedFormInput = {
      transporter: {
        company: {
          siret: transporter.company.siret,
          name: "N'importe",
          address: "Nawak"
        }
      },
      destination: {
        company: {
          siret: destination.company.siret,
          name: "N'importe",
          address: "Nawak"
        }
      }
    };

    const sirenified = await sirenifyResealedFormInput(resealedFormInput, {
      email: "john.snow@trackdechets.fr",
      auth: AuthType.Bearer
    } as Express.User);

    expect(sirenified.transporter!.company!.name).toEqual(
      searchResults[transporter.company.siret!].name
    );
    expect(sirenified.transporter!.company!.address).toEqual(
      searchResults[transporter.company.siret!].address
    );
    expect(sirenified.destination!.company!.name).toEqual(
      searchResults[destination.company.siret!].name
    );
    expect(sirenified.destination!.company!.address).toEqual(
      searchResults[destination.company.siret!].address
    );
  });

  it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` is not provided", async () => {
    const transporter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");

    function searchResult(companyName: string) {
      return {
        name: companyName,
        address: `Adresse ${companyName}`,
        statutDiffusionEtablissement: "O"
      } as CompanySearchResult;
    }

    const searchResults = {
      [transporter.company.siret!]: searchResult("transporteur"),
      [destination.company.siret!]: searchResult("destination")
    };

    (searchCompany as jest.Mock).mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
    });

    const resealedFormInput: ResealedFormInput = {
      transporter: {
        company: {
          siret: transporter.company.siret
        }
      },
      destination: {
        company: {
          siret: destination.company.siret
        }
      }
    };

    const sirenified = await sirenifyResealedFormInput(resealedFormInput, {
      email: "john.snow@trackdechets.fr",
      auth: AuthType.Bearer
    } as Express.User);

    expect(sirenified.transporter!.company!.name).toEqual(
      searchResults[transporter.company.siret!].name
    );
    expect(sirenified.transporter!.company!.address).toEqual(
      searchResults[transporter.company.siret!].address
    );
    expect(sirenified.destination!.company!.name).toEqual(
      searchResults[destination.company.siret!].name
    );
    expect(sirenified.destination!.company!.address).toEqual(
      searchResults[destination.company.siret!].address
    );
  });
});

describe("sirenifyFormCreateInput", () => {
  afterEach(resetDatabase);

  it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` are provided", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const recipient = await userWithCompanyFactory("MEMBER");
    const broker = await userWithCompanyFactory("MEMBER");
    const trader = await userWithCompanyFactory("MEMBER");
    const exutoire = await userWithCompanyFactory("MEMBER");
    const intermediary1 = await userWithCompanyFactory("MEMBER");
    const intermediary2 = await userWithCompanyFactory("MEMBER");
    const ecoOrganisme = await userWithCompanyFactory("MEMBER");

    function searchResult(companyName: string) {
      return {
        name: companyName,
        address: `Adresse ${companyName}`,
        statutDiffusionEtablissement: "O"
      } as CompanySearchResult;
    }

    const searchResults = {
      [emitter.company.siret!]: searchResult("émetteur"),
      [transporter.company.siret!]: searchResult("transporteur"),
      [recipient.company.siret!]: searchResult("destinataire"),
      [broker.company.siret!]: searchResult("courtier"),
      [trader.company.siret!]: searchResult("négociant"),
      [exutoire.company.siret!]: searchResult("destinataire final"),
      [intermediary1.company.siret!]: searchResult("intermédiaire 1"),
      [intermediary2.company.siret!]: searchResult("intermédiaire 2")
    };

    (searchCompany as jest.Mock).mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
    });

    const user = await userFactory();

    const formInput: Prisma.FormCreateInput = {
      readableId: "READABLE-ID",
      status: Status.DRAFT,
      owner: { connect: { id: user.id } },
      emitterType: EmitterType.PRODUCER,
      emitterPickupSite: "",
      emitterIsPrivateIndividual: true,
      emitterIsForeignShip: false,
      emitterCompanyName: emitter.company.name,
      emitterCompanySiret: emitter.company.siret,
      emitterCompanyAddress: emitter.company.address,
      emitterCompanyContact: emitter.company.contact,
      emitterCompanyPhone: emitter.company.contactPhone,
      emitterCompanyMail: emitter.company.contactEmail,
      emitterCompanyOmiNumber: "",
      emitterWorkSiteName: "",
      emitterWorkSiteAddress: "",
      emitterWorkSiteCity: "",
      emitterWorkSitePostalCode: "",
      emitterWorkSiteInfos: "",
      recipientCap: "",
      recipientProcessingOperation: "",
      recipientCompanyName: recipient.company.name,
      recipientCompanySiret: recipient.company.siret,
      recipientCompanyAddress: recipient.company.address,
      recipientCompanyContact: recipient.company.contact,
      recipientCompanyPhone: recipient.company.contactPhone,
      recipientCompanyMail: recipient.company.contactEmail,
      recipientIsTempStorage: false,
      wasteDetailsCode: "",
      wasteDetailsOnuCode: "",
      wasteDetailsPackagingInfos: Prisma.JsonNull,
      wasteDetailsQuantity: 0,
      wasteDetailsQuantityType: "ESTIMATED",
      wasteDetailsPop: false,
      wasteDetailsIsDangerous: true,
      wasteDetailsParcelNumbers: Prisma.JsonNull,
      wasteDetailsAnalysisReferences: [],
      wasteDetailsLandIdentifiers: [],
      wasteDetailsName: "",
      wasteDetailsConsistence: "SOLID",
      wasteDetailsSampleNumber: "",
      traderCompanyName: trader.company.name,
      traderCompanySiret: trader.company.siret,
      traderCompanyAddress: trader.company.address,
      traderCompanyContact: trader.company.contact,
      traderCompanyPhone: trader.company.contactPhone,
      traderCompanyMail: trader.company.contactEmail,
      traderReceipt: "",
      traderDepartment: "",
      traderValidityLimit: new Date(),
      brokerCompanyName: broker.company.name,
      brokerCompanySiret: broker.company.siret,
      brokerCompanyAddress: broker.company.address,
      brokerCompanyContact: broker.company.contact,
      brokerCompanyPhone: broker.company.contactPhone,
      brokerCompanyMail: broker.company.contactEmail,
      brokerReceipt: "",
      brokerDepartment: "",
      brokerValidityLimit: new Date(),
      ecoOrganismeName: ecoOrganisme.company.name,
      ecoOrganismeSiret: ecoOrganisme.company.address,
      transporters: {
        create: {
          transporterCompanyName: transporter.company.name,
          transporterCompanySiret: transporter.company.siret,
          transporterCompanyAddress: transporter.company.address,
          transporterCompanyContact: transporter.company.contact,
          transporterCompanyPhone: transporter.company.contactPhone,
          transporterCompanyMail: transporter.company.contactEmail,
          transporterCompanyVatNumber: "",
          transporterReceipt: "",
          transporterDepartment: "",
          transporterValidityLimit: new Date(),
          transporterTransportMode: "ROAD",
          transporterIsExemptedOfReceipt: false,
          number: 1,
          readyToTakeOver: true
        }
      },
      intermediaries: {
        createMany: {
          data: [
            {
              siret: intermediary1.company.siret ?? "",
              address: intermediary1.company.address,
              vatNumber: intermediary1.company.vatNumber,
              name: intermediary1.company.name,
              contact: intermediary1.company.contact ?? "",
              phone: intermediary1.company.contactPhone,
              mail: intermediary1.company.contactEmail
            },
            {
              siret: intermediary2.company.siret ?? "",
              address: intermediary2.company.address,
              vatNumber: intermediary2.company.vatNumber,
              name: intermediary2.company.name,
              contact: intermediary2.company.contact ?? "",
              phone: intermediary2.company.contactPhone,
              mail: intermediary2.company.contactEmail
            }
          ],
          skipDuplicates: true
        }
      }
    };

    const sirenified = await sirenifyFormCreateInput(formInput, []);

    // Emitter
    expect(sirenified.emitterCompanyName).toEqual(
      searchResults[emitter.company.siret!].name
    );
    expect(sirenified.emitterCompanyAddress).toEqual(
      searchResults[emitter.company.siret!].address
    );

    // Transporter
    expect(sirenified.transporters.create.transporterCompanyName).toEqual(
      searchResults[transporter.company.siret!].name
    );
    expect(sirenified.transporters.create.transporterCompanyAddress).toEqual(
      searchResults[transporter.company.siret!].address
    );

    // Recipient
    expect(sirenified.recipientCompanyName).toEqual(
      searchResults[recipient.company.siret!].name
    );
    expect(sirenified.recipientCompanyAddress).toEqual(
      searchResults[recipient.company.siret!].address
    );

    // Broker
    expect(sirenified.brokerCompanyName).toEqual(
      searchResults[broker.company.siret!].name
    );
    expect(sirenified.brokerCompanyAddress).toEqual(
      searchResults[broker.company.siret!].address
    );

    // Trader
    expect(sirenified.traderCompanyName).toEqual(
      searchResults[trader.company.siret!].name
    );
    expect(sirenified.traderCompanyAddress).toEqual(
      searchResults[trader.company.siret!].address
    );

    // Intermediaries
    expect(sirenified.intermediaries.createMany.data[0].name).toEqual(
      searchResults[intermediary1.company.siret!].name
    );
    expect(sirenified.intermediaries.createMany.data[0].address).toEqual(
      searchResults[intermediary1.company.siret!].address
    );
    expect(sirenified.intermediaries.createMany.data[1].name).toEqual(
      searchResults[intermediary2.company.siret!].name
    );
    expect(sirenified.intermediaries.createMany.data[1].address).toEqual(
      searchResults[intermediary2.company.siret!].address
    );
  });
});
