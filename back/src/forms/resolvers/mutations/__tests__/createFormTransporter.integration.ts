import { gql } from "graphql-tag";
import { companyFactory, userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { Mutation, MutationCreateFormTransporterArgs } from "@td/codegen-back";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { AuthType } from "../../../../auth";

const CREATE_FORM_TRANSPORTER = gql`
  mutation CreateFormTransporter($input: TransporterInput!) {
    createFormTransporter(input: $input) {
      id
      company {
        siret
      }
    }
  }
`;

describe("Mutation.createFormTransporter", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient(null);
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const { errors } = await mutate<
      Pick<Mutation, "createFormTransporter">,
      MutationCreateFormTransporterArgs
    >(CREATE_FORM_TRANSPORTER, {
      variables: {
        input: {
          company: {
            siret: transporter.siret,
            name: transporter.name,
            address: transporter.address,
            contact: transporter.contact
          },
          mode: "ROAD",
          receipt: "receipt",
          department: "07",
          validityLimit: new Date().toISOString() as any
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({ message: "Vous n'êtes pas connecté." })
    ]);
  });

  it("should throw error if data does not pass validation", async () => {
    const user = await userFactory();
    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createFormTransporter">,
      MutationCreateFormTransporterArgs
    >(CREATE_FORM_TRANSPORTER, {
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
        message:
          "Transporteur: 123 n'est pas un numéro de SIRET valide\n" +
          "Transporteur : l'établissement avec le SIRET 123 n'est pas inscrit sur Trackdéchets"
      })
    ]);
  });

  it("should create a form transporter", async () => {
    const user = await userFactory();
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
      Pick<Mutation, "createFormTransporter">,
      MutationCreateFormTransporterArgs
    >(CREATE_FORM_TRANSPORTER, {
      variables: {
        input: {
          company: {
            siret: transporter.siret,
            name: transporter.name,
            address: transporter.address,
            contact: transporter.contact
          },
          mode: "ROAD",
          receipt: "receipt", // should be ignored
          department: "07", // should be ignored
          validityLimit: new Date().toISOString() as any // should be ignored
        }
      }
    });
    expect(errors).toBeUndefined();
    expect(data.createFormTransporter!.id).toBeDefined();

    const bsddTransporter = await prisma.bsddTransporter.findUniqueOrThrow({
      where: { id: data.createFormTransporter!.id }
    });

    expect(bsddTransporter).toMatchObject({
      transporterCompanySiret: transporter.siret,
      transporterCompanyName: transporter.name,
      transporterCompanyAddress: transporter.address,
      transporterCompanyContact: transporter.contact,
      // Les informations de récépissé doivent correspondre
      // aux informations du profil transporteur. Les données
      // envoyées par l'utilisateur sont ignorées.
      transporterReceipt: "MON-RECEPISSE",
      transporterDepartment: "13",
      transporterValidityLimit: new Date("2024-01-01"),
      formId: null,
      number: 0,
      readyToTakeOver: true
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

    const user = await userFactory();
    const { mutate } = makeClientLocal({
      ...user,
      auth: AuthType.Bearer
    });
    const { errors, data } = await mutate<
      Pick<Mutation, "createFormTransporter">,
      MutationCreateFormTransporterArgs
    >(CREATE_FORM_TRANSPORTER, {
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

    const bsddTransporter = await prisma.bsddTransporter.findUniqueOrThrow({
      where: { id: data.createFormTransporter!.id }
    });

    expect(bsddTransporter.transporterCompanyName).toEqual(searchResult.name);
    expect(bsddTransporter.transporterCompanyAddress).toEqual(
      searchResult.address
    );
  });

  it("should not auto-complete recepisse information if transporter is exempted", async () => {
    const user = await userFactory();
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
      Pick<Mutation, "createFormTransporter">,
      MutationCreateFormTransporterArgs
    >(CREATE_FORM_TRANSPORTER, {
      variables: {
        input: {
          company: {
            siret: transporter.siret,
            name: transporter.name,
            address: transporter.address,
            contact: transporter.contact
          },
          mode: "ROAD",
          isExemptedOfReceipt: true
        }
      }
    });
    expect(errors).toBeUndefined();
    expect(data.createFormTransporter!.id).toBeDefined();

    const bsddTransporter = await prisma.bsddTransporter.findUniqueOrThrow({
      where: { id: data.createFormTransporter!.id }
    });

    expect(bsddTransporter).toMatchObject({
      transporterIsExemptedOfReceipt: true,
      transporterReceipt: null,
      transporterDepartment: null,
      transporterValidityLimit: null
    });
  });
});
