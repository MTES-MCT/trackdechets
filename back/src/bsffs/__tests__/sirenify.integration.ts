import { CompanySearchResult } from "../../companies/types";
import { userWithCompanyFactory } from "../../__tests__/factories";
import { searchCompany } from "../../companies/search";
import {
  BsffFicheInterventionInput,
  BsffInput,
  UpdateBsffPackagingInput
} from "../../generated/graphql/types";
import {
  sirenifyBsffInput,
  sirenifyBsffPackagingInput,
  sirenifyBsffFicheInterventionInput,
  sirenifyBsffCreateInput,
  sirenifyBsffTransporterCreateInput
} from "../sirenify";
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

describe("sirenifyBsffInput", () => {
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

    const bsffInput: BsffInput = {
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

    const sirenified = await sirenifyBsffInput(bsffInput, {
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

    const bsffInput: BsffInput = {
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

    const sirenified = await sirenifyBsffInput(bsffInput, {
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

describe("sirenifyBsffPackagingInput", () => {
  afterEach(resetDatabase);

  it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` are provided", async () => {
    const nextDestination = await userWithCompanyFactory("MEMBER");

    const searchResults = {
      [nextDestination.company.siret!]: searchResult("destination ultérieure")
    };

    (searchCompany as jest.Mock).mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
    });

    const bsffPackagingInput: UpdateBsffPackagingInput = {
      operation: {
        code: "R2",
        date: new Date(),
        description: "régénération",
        nextDestination: {
          company: {
            siret: nextDestination.company.siret,
            name: "N'importe",
            address: "Nawak"
          }
        }
      }
    };

    const sirenified = await sirenifyBsffPackagingInput(bsffPackagingInput, {
      email: "john.snow@trackdechets.fr",
      auth: AuthType.Bearer
    } as Express.User);

    expect(sirenified.operation!.nextDestination!.company!.name).toEqual(
      searchResults[nextDestination.company.siret!].name
    );
    expect(sirenified.operation!.nextDestination!.company!.address).toEqual(
      searchResults[nextDestination.company.siret!].address
    );
  });

  it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` are not provided", async () => {
    const nextDestination = await userWithCompanyFactory("MEMBER");

    const searchResults = {
      [nextDestination.company.siret!]: searchResult("destination ultérieure")
    };

    (searchCompany as jest.Mock).mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
    });

    const bsffPackagingInput: UpdateBsffPackagingInput = {
      operation: {
        code: "R2",
        date: new Date(),
        description: "régénération",
        nextDestination: {
          company: {
            siret: nextDestination.company.siret
          }
        }
      }
    };

    const sirenified = await sirenifyBsffPackagingInput(bsffPackagingInput, {
      email: "john.snow@trackdechets.fr",
      auth: AuthType.Bearer
    } as Express.User);

    expect(sirenified.operation!.nextDestination!.company!.name).toEqual(
      searchResults[nextDestination.company.siret!].name
    );
    expect(sirenified.operation!.nextDestination!.company!.address).toEqual(
      searchResults[nextDestination.company.siret!].address
    );
  });
});

describe("sirenifyBsffFicheInterventionInput", () => {
  afterEach(resetDatabase);

  it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` are provided", async () => {
    const detenteur = await userWithCompanyFactory("MEMBER");
    const operateur = await userWithCompanyFactory("MEMBER");

    const searchResults = {
      [detenteur.company.siret!]: searchResult("détenteur"),
      [operateur.company.siret!]: searchResult("opérateur")
    };

    (searchCompany as jest.Mock).mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
    });

    const ficheInterventionInput: BsffFicheInterventionInput = {
      numero: "FI",
      postalCode: "13001",
      weight: 1,
      operateur: {
        company: {
          siret: operateur.company.siret,
          name: "N'importe",
          address: "Nawak"
        }
      },
      detenteur: {
        company: {
          siret: detenteur.company.siret,
          name: "N'importe",
          address: "Nawak"
        }
      }
    };

    const sirenified = await sirenifyBsffFicheInterventionInput(
      ficheInterventionInput,
      {
        email: "john.snow@trackdechets.fr",
        auth: AuthType.Bearer
      } as Express.User
    );

    expect(sirenified.detenteur.company!.name).toEqual(
      searchResults[detenteur.company.siret!].name
    );
    expect(sirenified.detenteur.company!.address).toEqual(
      searchResults[detenteur.company.siret!].address
    );
    expect(sirenified.operateur.company.name).toEqual(
      searchResults[operateur.company.siret!].name
    );
    expect(sirenified.operateur.company.address).toEqual(
      searchResults[operateur.company.siret!].address
    );
  });

  it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` are not provided", async () => {
    const detenteur = await userWithCompanyFactory("MEMBER");
    const operateur = await userWithCompanyFactory("MEMBER");

    const searchResults = {
      [detenteur.company.siret!]: searchResult("détenteur"),
      [operateur.company.siret!]: searchResult("opérateur")
    };

    (searchCompany as jest.Mock).mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
    });

    const ficheInterventionInput: BsffFicheInterventionInput = {
      numero: "FI",
      postalCode: "13001",
      weight: 1,
      operateur: {
        company: {
          siret: operateur.company.siret
        }
      },
      detenteur: {
        company: {
          siret: detenteur.company.siret
        }
      }
    };

    const sirenified = await sirenifyBsffFicheInterventionInput(
      ficheInterventionInput,
      {
        email: "john.snow@trackdechets.fr",
        auth: AuthType.Bearer
      } as Express.User
    );

    expect(sirenified.detenteur.company!.name).toEqual(
      searchResults[detenteur.company.siret!].name
    );
    expect(sirenified.detenteur.company!.address).toEqual(
      searchResults[detenteur.company.siret!].address
    );
    expect(sirenified.operateur.company.name).toEqual(
      searchResults[operateur.company.siret!].name
    );
    expect(sirenified.operateur.company.address).toEqual(
      searchResults[operateur.company.siret!].address
    );
  });
});

describe("sirenifyBsffCreateInput", () => {
  afterEach(resetDatabase);

  it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` are provided", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");

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
      [destination.company.siret!]: searchResult("destinataire")
    };

    (searchCompany as jest.Mock).mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
    });

    const bsffPrismaCreateInput = {
      // Emitter company info
      emitterCompanySiret: emitter.company.siret,
      emitterCompanyAddress: emitter.company.address,
      emitterCompanyName: emitter.company.name,
      // Destination company info
      destinationCompanySiret: destination.company.siret,
      destinationCompanyAddress: destination.company.address,
      destinationCompanyName: destination.company.name
    } as Prisma.BsffCreateInput;

    const sirenified = await sirenifyBsffCreateInput(bsffPrismaCreateInput, []);

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
  });
});

describe("sirenifyBsffTransporterCreateInput", () => {
  afterEach(resetDatabase);

  it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` are provided", async () => {
    const transporter = await userWithCompanyFactory("MEMBER");

    function searchResult(companyName: string) {
      return {
        name: companyName,
        address: `Adresse ${companyName}`,
        statutDiffusionEtablissement: "O"
      } as CompanySearchResult;
    }

    const searchResults = {
      [transporter.company.siret!]: searchResult("transporteur")
    };

    (searchCompany as jest.Mock).mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
    });

    const bsffTransporterPrismaCreateInput = {
      // Transporter company info
      transporterCompanySiret: transporter.company.siret,
      transporterCompanyAddress: transporter.company.address,
      transporterCompanyName: transporter.company.name
    } as Prisma.BsffTransporterCreateInput;

    const sirenified = await sirenifyBsffTransporterCreateInput(
      bsffTransporterPrismaCreateInput,
      []
    );

    expect(sirenified.transporterCompanyName).toEqual(
      searchResults[transporter.company.siret!].name
    );
    expect(sirenified.transporterCompanyAddress).toEqual(
      searchResults[transporter.company.siret!].address
    );
  });
});
