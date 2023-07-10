import { CompanySearchResult } from "../../../companies/types";
import { userWithCompanyFactory } from "../../../__tests__/factories";
import * as search from "../../../companies/search";
import { sirenify } from "../sirenify";
import { resetDatabase } from "../../../../integration-tests/helper";

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

    const bsdaInput = {
      emitterCompanySiret: emitter.company.siret,
      emitterCompanyName: "N'importe",
      emitterCompanyAddress: "Nawak",
      transporterCompanySiret: transporter.company.siret,
      transporterCompanyName: "N'importe",
      transporterCompanyAddress: "Nawak",
      destinationCompanySiret: destination.company.siret,
      destinationCompanyName: "N'importe",
      destinationCompanyAddress: "Nawak",
      workerCompanySiret: worker.company.siret,
      workerCompanyName: "N'importe",
      workerCompanyAddress: "Nawak",
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

    const sirenified = await sirenify(bsdaInput, []);

    expect(sirenified.emitterCompanyName).toEqual(
      searchResults[emitter.company.siret!].name
    );
    expect(sirenified.emitterCompanyAddress).toEqual(
      searchResults[emitter.company.siret!].address
    );
    expect(sirenified.transporterCompanyName).toEqual(
      searchResults[transporter.company.siret!].name
    );
    expect(sirenified.transporterCompanyAddress).toEqual(
      searchResults[transporter.company.siret!].address
    );
    expect(sirenified.destinationCompanyName).toEqual(
      searchResults[destination.company.siret!].name
    );
    expect(sirenified.destinationCompanyAddress).toEqual(
      searchResults[destination.company.siret!].address
    );
    expect(sirenified.workerCompanyName).toEqual(
      searchResults[worker.company.siret!].name
    );
    expect(sirenified.workerCompanyAddress).toEqual(
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

    const bsdaInput = {
      emitterCompanySiret: emitter.company.siret,
      transporterCompanySiret: transporter.company.siret,
      destinationCompanySiret: destination.company.siret,
      workerCompanySiret: worker.company.siret,
      intermediaries: [
        {
          siret: intermediary1.company.siret
        },
        {
          siret: intermediary2.company.siret
        }
      ]
    };

    const sirenified = await sirenify(bsdaInput, []);

    expect(sirenified.emitterCompanyName).toEqual(
      searchResults[emitter.company.siret!].name
    );
    expect(sirenified.emitterCompanyAddress).toEqual(
      searchResults[emitter.company.siret!].address
    );
    expect(sirenified.transporterCompanyName).toEqual(
      searchResults[transporter.company.siret!].name
    );
    expect(sirenified.transporterCompanyAddress).toEqual(
      searchResults[transporter.company.siret!].address
    );
    expect(sirenified.destinationCompanyName).toEqual(
      searchResults[destination.company.siret!].name
    );
    expect(sirenified.destinationCompanyAddress).toEqual(
      searchResults[destination.company.siret!].address
    );
    expect(sirenified.workerCompanyName).toEqual(
      searchResults[worker.company.siret!].name
    );
    expect(sirenified.workerCompanyAddress).toEqual(
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
