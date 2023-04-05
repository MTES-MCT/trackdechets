import { faker } from "@faker-js/faker";
import { AuthType } from "@prisma/client";
import { CompanyInput } from "../../generated/graphql/types";
import buildSirenify, { searchCompanyFailFast } from "../sirenify";

const searchCompanySpy = jest.spyOn(
  require("../../companies/search"),
  "searchCompany"
);

type Input = { company: CompanyInput };

const searchResult = {
  siret: "85001946400021",
  etatAdministratif: "A",
  statutDiffusionEtablissement: "O",
  address: "4 bis BD LONGCHAMP Bat G 13001 MARSEILLE",
  addressVoie: "4 bis BD LONGCHAMP Bat G",
  addressPostalCode: "13001",
  addressCity: "MARSEILLE",
  codeCommune: "13201",
  name: "CODE EN STOCK",
  naf: "62.01Z",
  libelleNaf: "Programmation informatique",
  codePaysEtrangerEtablissement: ""
};

const accessors = (input: Input) => [
  {
    getter: () => input?.company,
    setter: (input: Input, companyInput: CompanyInput) => ({
      ...input,
      company: companyInput
    })
  }
];

const sirenify = buildSirenify(accessors);

describe("sirenify", () => {
  it("should throw exception on closed company", async () => {
    searchCompanySpy.mockResolvedValueOnce({
      ...searchResult,
      etatAdministratif: "F"
    });

    const input: Input = {
      company: {
        siret: searchResult.siret
      }
    };

    const sirenifyFn = () =>
      sirenify(input, {
        email: "john.snow@trackdechets.fr",
        auth: AuthType.BEARER
      } as Express.User);

    await expect(sirenifyFn).rejects.toThrow(
      `L'établissement ${searchResult.siret} est fermé selon le répertoire SIRENE`
    );
  });

  it("should by pass auto-completion of name and address if request is made from TD UI", async () => {
    const input: Input = {
      company: {
        siret: searchResult.siret,
        name: "N'importe",
        address: "Nawak"
      }
    };

    const sirenified = await sirenify(input, {
      email: "john.snow@trackdechets.fr",
      auth: AuthType.SESSION
    } as Express.User);

    expect(sirenified).toEqual(input);
  });

  it("should by pass auto-completion of name and address if company is non diffusible", async () => {
    searchCompanySpy.mockResolvedValueOnce({
      ...searchResult,
      statutDiffusionEtablissement: "N"
    });

    const input: Input = {
      company: {
        siret: searchResult.siret,
        name: "Cabinet médical Dumont",
        address: "1 rue Pasteur"
      }
    };

    const sirenified = await sirenify(input, {
      email: "john.snow@trackdechets.fr",
      auth: AuthType.BEARER
    } as Express.User);

    expect(sirenified).toEqual(input);
  });

  it("should by pass auto-completion of name and address if user email is in by pass list", async () => {
    const OLD_ENV = process.env;
    jest.resetModules();

    const email = faker.internet.email("john");
    process.env = {
      ...OLD_ENV,
      SIRENIFY_BYPASS_USER_EMAILS: `${email},trackdechets.fr`
    };

    const buildSirenify = require("../sirenify").default;
    const sirenifyLocal = buildSirenify(accessors);

    const input: Input = {
      company: {
        siret: searchResult.siret,
        name: "N'importe",
        address: "Nawak"
      }
    };

    let sirenified = await sirenifyLocal(input, {
      email,
      auth: AuthType.BEARER
    } as Express.User);

    expect(sirenified).toEqual(input);

    sirenified = await sirenifyLocal(input, {
      email: "john@trackdechets.fr",
      auth: AuthType.BEARER
    } as Express.User);

    expect(sirenified).toEqual(input);
  });
});

describe("searchCompanyFailFast", () => {
  it("should timeout and return null if searchCompany takes more than 1 second to respond", async () => {
    const searchCompanyMock = jest.fn().mockReturnValue(searchResult);
    searchCompanySpy.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve(searchCompanyMock()), 1200)
        )
    );
    const r = await searchCompanyFailFast("85001946400021");
    expect(r).toBeNull();
    expect(searchCompanyMock).not.toHaveBeenCalled();
  });

  it("should return result if searchCompany takes less than 1 second to respond", async () => {
    searchCompanySpy.mockResolvedValue(searchResult);
    const r = await searchCompanyFailFast("85001946400021");
    expect(r!.name).toEqual("CODE EN STOCK");
  });
});
