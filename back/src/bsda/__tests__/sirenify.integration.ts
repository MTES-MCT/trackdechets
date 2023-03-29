import { CompanySearchResult } from "../../companies/types";
import { userWithCompanyFactory } from "../../__tests__/factories";
import * as search from "../../companies/search";
import { BsdaInput } from "../../generated/graphql/types";
import sirenify from "../sirenify";
import { AuthType } from "../../auth";
import { resetDatabase } from "../../../integration-tests/helper";

const searchCompanySpy = jest.spyOn(search, "searchCompany");

describe("sirenify", () => {
  afterEach(resetDatabase);

  it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` are provided", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const worker = await userWithCompanyFactory("MEMBER");
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
      [destination.company.siret!]: searchResult("destinataire"),
      [worker.company.siret!]: searchResult("courtier"),
      [intermediary1.company.siret!]: searchResult("intermédiaire 1"),
      [intermediary2.company.siret!]: searchResult("intermédiaire 2")
    };

    searchCompanySpy.mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
    });

    const bsdaInput: BsdaInput = {
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
      destination: {
        company: {
          siret: destination.company.siret,
          name: "N'importe",
          address: "Nawak"
        }
      },
      worker: {
        company: {
          siret: worker.company.siret,
          name: "N'importe",
          address: "Nawak"
        }
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
      ]
    };

    const sirenified = await sirenify(bsdaInput, {
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
    expect(sirenified.destination!.company!.name).toEqual(
      searchResults[destination.company.siret!].name
    );
    expect(sirenified.destination!.company!.address).toEqual(
      searchResults[destination.company.siret!].address
    );
    expect(sirenified.worker!.company!.name).toEqual(
      searchResults[worker.company.siret!].name
    );
    expect(sirenified.worker!.company!.address).toEqual(
      searchResults[worker.company.siret!].address
    );
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

  it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` are not provided", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const worker = await userWithCompanyFactory("MEMBER");
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
      [destination.company.siret!]: searchResult("destinataire"),
      [worker.company.siret!]: searchResult("courtier"),
      [intermediary1.company.siret!]: searchResult("intermédiaire 1"),
      [intermediary2.company.siret!]: searchResult("intermédiaire 2")
    };

    searchCompanySpy.mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
    });

    const bsdaInput: BsdaInput = {
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
      destination: {
        company: {
          siret: destination.company.siret
        }
      },
      worker: {
        company: {
          siret: worker.company.siret
        }
      },
      intermediaries: [
        {
          siret: intermediary1.company.siret
        },
        {
          siret: intermediary2.company.siret
        }
      ]
    };

    const sirenified = await sirenify(bsdaInput, {
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
    expect(sirenified.destination!.company!.name).toEqual(
      searchResults[destination.company.siret!].name
    );
    expect(sirenified.destination!.company!.address).toEqual(
      searchResults[destination.company.siret!].address
    );
    expect(sirenified.worker!.company!.name).toEqual(
      searchResults[worker.company.siret!].name
    );
    expect(sirenified.worker!.company!.address).toEqual(
      searchResults[worker.company.siret!].address
    );
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
});
