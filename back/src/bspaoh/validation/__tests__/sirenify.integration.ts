import { CompanySearchResult } from "@td/codegen-back";
import { userWithCompanyFactory } from "../../../__tests__/factories";
import { searchCompany } from "../../../companies/search";
import { sirenify } from "../sirenify";
import { resetDatabase } from "../../../../integration-tests/helper";

jest.mock("../../../companies/search");

describe("sirenify", () => {
  afterEach(resetDatabase);

  it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` are provided", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
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
      [emitter.company.siret!]: searchResult("émetteur"),
      [transporter.company.siret!]: searchResult("transporteur"),
      [destination.company.siret!]: searchResult("crematorium")
    };

    (searchCompany as jest.Mock).mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
    });

    const bspaohInput = {
      emitterCompanySiret: emitter.company.siret,
      emitterCompanyName: "N'importe",
      emitterCompanyAddress: "Peu importe",
      transporterCompanySiret: transporter.company.siret,
      transporterCompanyName: "N'importe",
      transporterCompanyAddress: "Peu importe",
      destinationCompanySiret: destination.company.siret,
      destinationCompanyName: "N'importe",
      destinationCompanyAddress: "Peu importe"
    };

    const sirenified = await sirenify(bspaohInput, []);

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
  });

  it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` are not provided", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
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
      [emitter.company.siret!]: searchResult("émetteur"),
      [transporter.company.siret!]: searchResult("transporteur"),
      [destination.company.siret!]: searchResult("destinataire")
    };

    (searchCompany as jest.Mock).mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
    });

    const bspaohInput = {
      emitterCompanySiret: emitter.company.siret,
      transporterCompanySiret: transporter.company.siret,

      destinationCompanySiret: destination.company.siret
    };

    const sirenified = await sirenify(bspaohInput, []);

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
  });

  it("should not overwrite `name` and `address` based on SIRENE data for sealed fields", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
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
      [emitter.company.siret!]: searchResult("émetteur"),
      [transporter.company.siret!]: searchResult("transporteur"),
      [destination.company.siret!]: searchResult("destinataire")
    };

    (searchCompany as jest.Mock).mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
    });

    const bspaohInput = {
      emitterCompanySiret: emitter.company.siret,
      emitterCompanyName: "N'importe",
      emitterCompanyAddress: "Peu importe",
      transporterCompanySiret: transporter.company.siret,
      transporterCompanyName: "N'importe",
      transporterCompanyAddress: "Peu importe",
      destinationCompanySiret: destination.company.siret,
      destinationCompanyName: "N'importe",
      destinationCompanyAddress: "Peu importe"
    };

    const sealedFields = ["emitterCompanySiret", "transporterCompanySiret"];
    const sirenified = await sirenify(bspaohInput, sealedFields);

    // Unchanged
    expect(sirenified.emitterCompanyName).toEqual(
      bspaohInput.emitterCompanyName
    );
    expect(sirenified.emitterCompanyAddress).toEqual(
      bspaohInput.emitterCompanyAddress
    );
    expect(sirenified.transporterCompanyName).toEqual(
      bspaohInput.transporterCompanyName
    );
    expect(sirenified.transporterCompanyAddress).toEqual(
      bspaohInput.transporterCompanyAddress
    );
    // Changed
    expect(sirenified.destinationCompanyName).toEqual(
      searchResults[destination.company.siret!].name
    );
    expect(sirenified.destinationCompanyAddress).toEqual(
      searchResults[destination.company.siret!].address
    );
  });
});
