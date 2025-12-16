import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import {
  companyFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import type {
  Mutation,
  MutationCreateBsffTransporterArgs
} from "@td/codegen-back";
import { prisma } from "@td/prisma";

const CREATE_BSFF_TRANSPORTER = gql`
  mutation CreateBsffTransporter($input: BsffTransporterInput!) {
    createBsffTransporter(input: $input) {
      id
      company {
        siret
      }
    }
  }
`;

describe("Mutation.createBsffTransporter", () => {
  afterEach(resetDatabase);

  it("should disallow user without create permission", async () => {
    // Given
    const { user } = await userWithCompanyFactory("READER");
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createBsffTransporter">,
      MutationCreateBsffTransporterArgs
    >(CREATE_BSFF_TRANSPORTER, {
      variables: {
        input: {
          company: {
            siret: transporter.siret,
            name: transporter.name,
            address: transporter.address,
            contact: transporter.contact
          },
          transport: {
            mode: "ROAD"
          }
        }
      }
    });
    expect(errors[0].message).toEqual(
      "Vous n'êtes pas autorisé à effectuer cette action"
    );
  });

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient(null);
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const { errors } = await mutate<
      Pick<Mutation, "createBsffTransporter">,
      MutationCreateBsffTransporterArgs
    >(CREATE_BSFF_TRANSPORTER, {
      variables: {
        input: {
          company: {
            siret: transporter.siret,
            name: transporter.name,
            address: transporter.address,
            contact: transporter.contact
          },
          transport: {
            mode: "ROAD"
          }
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({ message: "Vous n'êtes pas connecté." })
    ]);
  });

  it("should throw error if data does not pass validation", async () => {
    const { user } = await userWithCompanyFactory("MEMBER");
    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createBsffTransporter">,
      MutationCreateBsffTransporterArgs
    >(CREATE_BSFF_TRANSPORTER, {
      variables: {
        input: {
          company: {
            siret: "123"
          }
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Transporteur : 123 n'est pas un SIRET valide"
      })
    ]);
  });

  it("should forbid invalid plates", async () => {
    const { user } = await userWithCompanyFactory("MEMBER");
    const { mutate } = makeClient(user);
    const transporter = await companyFactory({
      companyTypes: ["TRANSPORTER"],
      transporterReceipt: {
        create: {
          department: "13",
          receiptNumber: "MON-RECEPISSE",
          validityLimit: new Date("2024-01-01")
        }
      }
    });
    const { errors } = await mutate<
      Pick<Mutation, "createBsffTransporter">,
      MutationCreateBsffTransporterArgs
    >(CREATE_BSFF_TRANSPORTER, {
      variables: {
        input: {
          company: {
            siret: transporter.siret,
            name: transporter.name,
            address: transporter.address,
            contact: transporter.contact
          },
          transport: {
            mode: "ROAD",
            plates: ["XY"]
          },
          recepisse: {
            number: "receipt", // should be ignored
            department: "07", // should be ignored
            validityLimit: new Date().toISOString() as any // should be ignored
          }
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Le numéro d'immatriculation doit faire entre 4 et 12 caractères"
      })
    ]);
  });

  it("should create a BSFF transporter", async () => {
    const { user } = await userWithCompanyFactory("MEMBER");
    const { mutate } = makeClient(user);
    const transporter = await companyFactory({
      companyTypes: ["TRANSPORTER"],
      transporterReceipt: {
        create: {
          department: "13",
          receiptNumber: "MON-RECEPISSE",
          validityLimit: new Date("2024-01-01")
        }
      }
    });
    const { errors, data } = await mutate<
      Pick<Mutation, "createBsffTransporter">,
      MutationCreateBsffTransporterArgs
    >(CREATE_BSFF_TRANSPORTER, {
      variables: {
        input: {
          company: {
            siret: transporter.siret,
            name: transporter.name,
            address: transporter.address,
            contact: transporter.contact
          },
          transport: {
            mode: "ROAD"
          },
          recepisse: {
            number: "receipt", // should be ignored
            department: "07", // should be ignored
            validityLimit: new Date().toISOString() as any // should be ignored
          }
        }
      }
    });
    expect(errors).toBeUndefined();
    expect(data.createBsffTransporter!.id).toBeDefined();

    const bsffTransporter = await prisma.bsffTransporter.findUniqueOrThrow({
      where: { id: data.createBsffTransporter!.id }
    });

    expect(bsffTransporter).toMatchObject({
      transporterCompanySiret: transporter.siret,
      transporterCompanyName: transporter.name,
      transporterCompanyAddress: transporter.address,
      transporterCompanyContact: transporter.contact,
      // Les informations de récépissé doivent correspondre
      // aux informations du profil transporteur. Les données
      // envoyées par l'utilisateur sont ignorées.
      transporterRecepisseNumber: "MON-RECEPISSE",
      transporterRecepisseDepartment: "13",
      transporterRecepisseValidityLimit: new Date("2024-01-01"),
      number: 0
    });
  });

  it("should auto-complete name and address from SIRENE database", async () => {
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });

    const searchResult = {
      siret: transporter.siret,
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

    const searchCompanyMock = jest.fn().mockResolvedValue(searchResult);

    // mock les appels à la base SIRENE
    jest.mock("../../../../companies/search", () => ({
      // https://www.chakshunyu.com/blog/how-to-mock-only-one-function-from-a-module-in-jest/
      ...jest.requireActual("../../../../companies/search"),
      searchCompany: searchCompanyMock
    }));

    // ré-importe makeClient pour que searchCompany soit bien mocké
    jest.resetModules();
    const makeClientLocal = require("../../../../__tests__/testClient")
      .default as typeof makeClient;

    const { user } = await userWithCompanyFactory("MEMBER");
    const { mutate } = makeClientLocal(user);
    const { errors, data } = await mutate<
      Pick<Mutation, "createBsffTransporter">,
      MutationCreateBsffTransporterArgs
    >(CREATE_BSFF_TRANSPORTER, {
      variables: {
        input: {
          company: {
            siret: transporter.siret,
            name: transporter.name,
            address: transporter.address,
            contact: transporter.contact
          }
        }
      }
    });

    expect(errors).toBeUndefined();

    expect(searchCompanyMock).toHaveBeenCalledWith(transporter.siret);

    const bsffTransporter = await prisma.bsffTransporter.findUniqueOrThrow({
      where: { id: data.createBsffTransporter!.id }
    });

    expect(bsffTransporter.transporterCompanyName).toEqual(searchResult.name);
    expect(bsffTransporter.transporterCompanyAddress).toEqual(
      searchResult.address
    );
  });

  it("should not auto-complete recepisse information if transporter is exempted", async () => {
    const { user } = await userWithCompanyFactory("MEMBER");
    const { mutate } = makeClient(user);
    const transporter = await companyFactory({
      companyTypes: ["TRANSPORTER"],
      transporterReceipt: {
        create: {
          department: "13",
          receiptNumber: "MON-RECEPISSE",
          validityLimit: new Date("2024-01-01")
        }
      }
    });
    const { errors, data } = await mutate<
      Pick<Mutation, "createBsffTransporter">,
      MutationCreateBsffTransporterArgs
    >(CREATE_BSFF_TRANSPORTER, {
      variables: {
        input: {
          company: {
            siret: transporter.siret,
            name: transporter.name,
            address: transporter.address,
            contact: transporter.contact
          },
          transport: { mode: "ROAD" },
          recepisse: { isExempted: true }
        }
      }
    });
    expect(errors).toBeUndefined();
    expect(data.createBsffTransporter!.id).toBeDefined();

    const bsffTransporter = await prisma.bsffTransporter.findUniqueOrThrow({
      where: { id: data.createBsffTransporter!.id }
    });

    expect(bsffTransporter).toMatchObject({
      transporterRecepisseIsExempted: true,
      transporterRecepisseNumber: null,
      transporterRecepisseDepartment: null,
      transporterRecepisseValidityLimit: null
    });
  });
});
