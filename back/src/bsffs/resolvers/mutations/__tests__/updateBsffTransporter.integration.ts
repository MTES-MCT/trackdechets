import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import {
  companyFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import { prisma } from "@td/prisma";
import type {
  Mutation,
  MutationUpdateBsffTransporterArgs
} from "@td/codegen-back";
import { getFirstTransporter } from "../../../database";
import {
  createBsffAfterTransport,
  createBsffBeforeEmission,
  createBsffBeforeTransport
} from "../../../__tests__/factories";

const UPDATE_BSFF_TRANSPORTER = gql`
  mutation UpdateBffTransporter($id: ID!, $input: BsffTransporterInput!) {
    updateBsffTransporter(id: $id, input: $input) {
      id
    }
  }
`;

describe("Mutation.updateBsffTransporter", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient(null);
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const bsffTransporter = await prisma.bsffTransporter.create({
      data: {
        number: 0,
        transporterCompanySiret: transporter.siret,
        transporterCompanyName: transporter.name,
        transporterTransportMode: "ROAD"
      }
    });
    const { errors } = await mutate<
      Pick<Mutation, "updateBsffTransporter">,
      MutationUpdateBsffTransporterArgs
    >(UPDATE_BSFF_TRANSPORTER, {
      variables: {
        id: bsffTransporter.id,
        input: {
          transport: { mode: "RAIL" }
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({ message: "Vous n'êtes pas connecté." })
    ]);
  });

  it("should update a bsff transporter", async () => {
    const user = await userFactory();
    const { mutate } = makeClient(user);
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const bsffTransporter = await prisma.bsffTransporter.create({
      data: {
        number: 0,
        transporterCompanySiret: transporter.siret,
        transporterCompanyName: transporter.name,
        transporterTransportMode: "ROAD"
      }
    });
    const { errors, data } = await mutate<
      Pick<Mutation, "updateBsffTransporter">,
      MutationUpdateBsffTransporterArgs
    >(UPDATE_BSFF_TRANSPORTER, {
      variables: {
        id: bsffTransporter.id,
        input: {
          transport: {
            mode: "RAIL"
          }
        }
      }
    });
    expect(errors).toBeUndefined();

    const updatedBsffTransporter =
      await prisma.bsffTransporter.findUniqueOrThrow({
        where: { id: data.updateBsffTransporter!.id }
      });

    expect(updatedBsffTransporter.transporterTransportMode).toEqual("RAIL");
  });

  it("should be possible to update the siret of an existing transporter", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER", {
      companyTypes: ["TRANSPORTER"]
    });
    const anotherTransporter = await userWithCompanyFactory("MEMBER", {
      companyTypes: ["TRANSPORTER"]
    });
    const bsff = await createBsffBeforeEmission({
      emitter,
      transporter,
      destination
    });
    const bsffTransporter = await getFirstTransporter(bsff);
    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsffTransporter">,
      MutationUpdateBsffTransporterArgs
    >(UPDATE_BSFF_TRANSPORTER, {
      variables: {
        id: bsffTransporter!.id,
        input: {
          company: { siret: anotherTransporter.company.siret }
        }
      }
    });
    expect(errors).toBeUndefined();
    const updatedBsddTransporter = await getFirstTransporter(bsff);
    expect(updatedBsddTransporter?.transporterCompanySiret).toEqual(
      anotherTransporter.company.siret
    );

    // S'assure que le champ dé-normalisé `transporterOrgIds` soit bien à jour
    const updatedBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id }
    });
    expect(updatedBsff.transportersOrgIds).toEqual([
      anotherTransporter.company.siret
    ]);
  });

  it("should throw error if data does not pass validation", async () => {
    const user = await userFactory();
    const { mutate } = makeClient(user);
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const bsffTransporter = await prisma.bsffTransporter.create({
      data: {
        number: 0,
        transporterCompanySiret: transporter.siret,
        transporterCompanyName: transporter.name,
        transporterTransportMode: "ROAD"
      }
    });
    const { errors } = await mutate<
      Pick<Mutation, "updateBsffTransporter">,
      MutationUpdateBsffTransporterArgs
    >(UPDATE_BSFF_TRANSPORTER, {
      variables: {
        id: bsffTransporter.id,
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
    const user = await userFactory();
    const { mutate } = makeClient(user);
    const transporter = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    const bsffTransporter = await prisma.bsffTransporter.create({
      data: {
        number: 0,
        transporterCompanySiret: transporter.siret,
        transporterCompanyName: transporter.name,
        transporterTransportMode: "ROAD"
      }
    });
    const { errors } = await mutate<
      Pick<Mutation, "updateBsffTransporter">,
      MutationUpdateBsffTransporterArgs
    >(UPDATE_BSFF_TRANSPORTER, {
      variables: {
        id: bsffTransporter.id,
        input: {
          transport: {
            plates: ["XY"]
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

  it("should not be possible to update a transporter that has already signed", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER", {
      companyTypes: ["TRANSPORTER"]
    });
    const bsff = await createBsffAfterTransport({
      emitter,
      transporter,
      destination
    });
    const bsffTransporter = await getFirstTransporter(bsff);
    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsffTransporter">,
      MutationUpdateBsffTransporterArgs
    >(UPDATE_BSFF_TRANSPORTER, {
      variables: {
        id: bsffTransporter!.id,
        input: {
          transport: {
            mode: "RAIL"
          }
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Impossible de modifier ce transporteur car il a déjà signé le bordereau"
      })
    ]);
  });

  it("should not allow a user not part of a BSFF to update an associated transporter", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");

    const transporter = await userWithCompanyFactory("MEMBER", {
      companyTypes: ["TRANSPORTER"]
    });
    const bsff = await createBsffBeforeTransport({
      emitter,
      transporter,
      destination
    });
    const bsffTransporter = await getFirstTransporter(bsff);
    const randomUser = await userFactory();
    const { mutate } = makeClient(randomUser);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsffTransporter">,
      MutationUpdateBsffTransporterArgs
    >(UPDATE_BSFF_TRANSPORTER, {
      variables: {
        id: bsffTransporter!.id,
        input: {
          transport: {
            mode: "RAIL"
          }
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas autorisé à modifier ce transporteur BSFF"
      })
    ]);
  });

  it("should not be possible for a transporter to remove himself from a BSFF", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER", {
      companyTypes: ["TRANSPORTER"]
    });
    const anotherTransporter = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    const bsff = await createBsffBeforeTransport({
      emitter,
      transporter,
      destination
    });
    const bsffTransporter = await getFirstTransporter(bsff);
    const { mutate } = makeClient(transporter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsffTransporter">,
      MutationUpdateBsffTransporterArgs
    >(UPDATE_BSFF_TRANSPORTER, {
      variables: {
        id: bsffTransporter!.id,
        input: {
          company: { siret: anotherTransporter.siret }
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous ne pouvez pas enlever votre établissement du bordereau"
      })
    ]);
  });

  it("should auto-complete name and address from SIRENE database", async () => {
    const transporter = await userWithCompanyFactory("MEMBER", {
      companyTypes: ["TRANSPORTER"]
    });
    const emitter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");

    const bsff = await createBsffBeforeTransport({
      emitter,
      transporter,
      destination
    });
    const bsffTransporter = await getFirstTransporter(bsff);

    const transporter2 = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });

    const searchResult = {
      siret: transporter2.siret,
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

    jest.mock("../../../../companies/search", () => ({
      // https://www.chakshunyu.com/blog/how-to-mock-only-one-function-from-a-module-in-jest/
      ...jest.requireActual("../../../../companies/search"),
      searchCompany: searchCompanyMock
    }));

    // ré-importe makeClient pour que searchCompany soit bien mocké
    jest.resetModules();
    const makeClientLocal = require("../../../../__tests__/testClient")
      .default as typeof makeClient;

    const { mutate } = makeClientLocal(emitter.user);

    const { errors, data } = await mutate<
      Pick<Mutation, "updateBsffTransporter">,
      MutationUpdateBsffTransporterArgs
    >(UPDATE_BSFF_TRANSPORTER, {
      variables: {
        id: bsffTransporter!.id,
        input: {
          company: { siret: transporter2.siret }
        }
      }
    });

    expect(errors).toBeUndefined();

    expect(searchCompanyMock).toHaveBeenCalledWith(transporter2.siret);

    const updatedBsffTransporter =
      await prisma.bsffTransporter.findUniqueOrThrow({
        where: { id: data.updateBsffTransporter!.id }
      });

    expect(updatedBsffTransporter.transporterCompanyName).toEqual(
      searchResult.name
    );
    expect(updatedBsffTransporter.transporterCompanyAddress).toEqual(
      searchResult.address
    );
  });

  it("should auto-complete recepisse information when switching isExemptedOfReceipt from true to false", async () => {
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
    const bsffTransporter = await prisma.bsffTransporter.create({
      data: {
        number: 0,
        transporterCompanySiret: transporter.siret,
        transporterCompanyName: transporter.name,
        transporterTransportMode: "ROAD",
        transporterRecepisseIsExempted: true,
        transporterRecepisseNumber: null,
        transporterRecepisseValidityLimit: null,
        transporterRecepisseDepartment: null
      }
    });
    const { errors, data } = await mutate<
      Pick<Mutation, "updateBsffTransporter">,
      MutationUpdateBsffTransporterArgs
    >(UPDATE_BSFF_TRANSPORTER, {
      variables: {
        id: bsffTransporter.id,
        input: {
          recepisse: { isExempted: false }
        }
      }
    });
    expect(errors).toBeUndefined();

    const updatedBsffTransporter =
      await prisma.bsffTransporter.findUniqueOrThrow({
        where: { id: data.updateBsffTransporter!.id }
      });

    expect(updatedBsffTransporter.transporterRecepisseNumber).toEqual(
      "MON-RECEPISSE"
    );
    expect(updatedBsffTransporter.transporterRecepisseDepartment).toEqual("13");
    expect(updatedBsffTransporter.transporterRecepisseValidityLimit).toEqual(
      new Date("2024-01-01")
    );
  });

  it("should auto-complete recepisse information when updating SIRET", async () => {
    const user = await userFactory();
    const { mutate } = makeClient(user);
    const transporter1 = await companyFactory({
      companyTypes: ["TRANSPORTER"],
      transporterReceipt: {
        create: {
          department: "13",
          receiptNumber: "MON-RECEPISSE",
          validityLimit: new Date("2024-01-01")
        }
      }
    });
    const transporter2 = await companyFactory({
      companyTypes: ["TRANSPORTER"],
      transporterReceipt: {
        create: {
          department: "07",
          receiptNumber: "MON-RECEPISSE-2",
          validityLimit: new Date("2024-01-02")
        }
      }
    });
    const bsffTransporter = await prisma.bsffTransporter.create({
      data: {
        number: 0,
        transporterCompanySiret: transporter1.siret,
        transporterCompanyName: transporter1.name,
        transporterTransportMode: "ROAD",
        transporterRecepisseIsExempted: false,
        transporterRecepisseNumber: null,
        transporterRecepisseValidityLimit: null,
        transporterRecepisseDepartment: null
      }
    });
    const { errors, data } = await mutate<
      Pick<Mutation, "updateBsffTransporter">,
      MutationUpdateBsffTransporterArgs
    >(UPDATE_BSFF_TRANSPORTER, {
      variables: {
        id: bsffTransporter.id,
        input: {
          company: { siret: transporter2.siret },
          recepisse: {
            number: "IGNORE-ME", // should not be be taken into account
            department: "IGNORE-ME", // should not be be taken into account
            validityLimit: new Date("2024-01-01").toISOString() as any // should not be be taken into account
          }
        }
      }
    });
    expect(errors).toBeUndefined();
    const updatedBsffTransporter =
      await prisma.bsffTransporter.findUniqueOrThrow({
        where: { id: data.updateBsffTransporter!.id }
      });

    expect(updatedBsffTransporter.transporterRecepisseNumber).toEqual(
      "MON-RECEPISSE-2"
    );
    expect(updatedBsffTransporter.transporterRecepisseDepartment).toEqual("07");
    expect(updatedBsffTransporter.transporterRecepisseValidityLimit).toEqual(
      new Date("2024-01-02")
    );
  });
});
