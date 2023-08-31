import { CompanySearchResult } from "../../companies/types";
import { userWithCompanyFactory } from "../../__tests__/factories";
import * as search from "../../companies/search";
import {
  CreateFormInput,
  ResealedFormInput
} from "../../generated/graphql/types";
import { sirenifyFormInput, sirenifyResealedFormInput } from "../sirenify";
import { AuthType } from "../../auth";
import { resetDatabase } from "../../../integration-tests/helper";

const searchCompanySpy = jest.spyOn(search, "searchCompany");

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

    searchCompanySpy.mockImplementation((clue: string) => {
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

    searchCompanySpy.mockImplementation((clue: string) => {
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

    searchCompanySpy.mockImplementation((clue: string) => {
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

    searchCompanySpy.mockImplementation((clue: string) => {
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

    searchCompanySpy.mockImplementation((clue: string) => {
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
