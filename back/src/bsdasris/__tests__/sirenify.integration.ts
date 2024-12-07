import { CompanySearchResult } from "../../companies/types";
import { userWithCompanyFactory } from "../../__tests__/factories";
import { searchCompany } from "../../companies/search";
import { BsdasriInput } from "@td/codegen-back";
import { sirenify, sirenifyBsdasriCreateInput } from "../sirenify";
import { AuthType } from "../../auth";
import { resetDatabase } from "../../../integration-tests/helper";
import { Prisma } from "@prisma/client";

const searchResult = (companyName: string) => {
  return {
    name: companyName,
    address: `Adresse ${companyName}`,
    statutDiffusionEtablissement: "O"
  } as CompanySearchResult;
};

jest.mock("../../companies/search");

describe("sirenify", () => {
  afterEach(resetDatabase);

  it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` are provided", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");

    const searchResults = {
      [emitter.company.siret!]: searchResult("émetteur"),
      [transporter.company.siret!]: searchResult("transporteur"),
      [destination.company.siret!]: searchResult("destinataire")
    };

    (searchCompany as jest.Mock).mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
    });

    const bsdasriInput: BsdasriInput = {
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
      }
    };

    const sirenified = await sirenify(bsdasriInput, {
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
  });

  it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` are not provided", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");

    const searchResults = {
      [emitter.company.siret!]: searchResult("émetteur"),
      [transporter.company.siret!]: searchResult("transporteur"),
      [destination.company.siret!]: searchResult("destinataire")
    };

    (searchCompany as jest.Mock).mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
    });

    const bsdasriInput: BsdasriInput = {
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
      }
    };

    const sirenified = await sirenify(bsdasriInput, {
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
  });
});

describe("sirenifyBsdasriCreateInput", () => {
  afterEach(resetDatabase);

  it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` are provided", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");

    const searchResults = {
      [emitter.company.siret!]: searchResult("émetteur"),
      [transporter.company.siret!]: searchResult("transporteur"),
      [destination.company.siret!]: searchResult("destinataire")
    };

    (searchCompany as jest.Mock).mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
    });

    const bsdasriPrismaCreateInput = {
      // Emitter company info
      emitterCompanySiret: emitter.company.siret,
      emitterCompanyAddress: emitter.company.address,
      emitterCompanyName: emitter.company.name,
      // Destination company info
      destinationCompanySiret: destination.company.siret,
      destinationCompanyAddress: destination.company.address,
      destinationCompanyName: destination.company.name,
      // Transporter company info
      transporterCompanySiret: transporter.company.siret,
      transporterCompanyAddress: transporter.company.address,
      transporterCompanyName: transporter.company.name
    } as Prisma.BsdasriCreateInput;

    const sirenified = await sirenifyBsdasriCreateInput(
      bsdasriPrismaCreateInput,
      []
    );

    // Emitter
    expect(sirenified.emitterCompanyName).toEqual(
      searchResults[emitter.company.siret!].name
    );
    expect(sirenified.emitterCompanyAddress).toEqual(
      searchResults[emitter.company.siret!].address
    );

    // Destination
    expect(sirenified.destinationCompanyName).toEqual(
      searchResults[destination.company.siret!].name
    );
    expect(sirenified.destinationCompanyAddress).toEqual(
      searchResults[destination.company.siret!].address
    );

    // Transporter
    expect(sirenified.transporterCompanyName).toEqual(
      searchResults[transporter.company.siret!].name
    );
    expect(sirenified.transporterCompanyAddress).toEqual(
      searchResults[transporter.company.siret!].address
    );
  });
});
