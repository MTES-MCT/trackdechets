import { gql } from "graphql-tag";
import {
  companyFactory,
  formFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  Mutation,
  MutationUpdateFormTransporterArgs
} from "../../../../generated/graphql/types";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { getFirstTransporter } from "../../../database";
import { AuthType } from "../../../../auth";

const UPDATE_FORM_TRANSPORTER = gql`
  mutation UpdateFormTransporter($id: ID!, $input: TransporterInput!) {
    updateFormTransporter(id: $id, input: $input) {
      id
    }
  }
`;

describe("Mutation.createFormTransporter", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient(null);
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const bsddTransporter = await prisma.bsddTransporter.create({
      data: {
        number: 0,
        readyToTakeOver: true,
        transporterCompanySiret: transporter.siret,
        transporterCompanyName: transporter.name,
        transporterTransportMode: "ROAD"
      }
    });
    const { errors } = await mutate<
      Pick<Mutation, "updateFormTransporter">,
      MutationUpdateFormTransporterArgs
    >(UPDATE_FORM_TRANSPORTER, {
      variables: {
        id: bsddTransporter.id,
        input: {
          mode: "RAIL"
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({ message: "Vous n'êtes pas connecté." })
    ]);
  });

  it("should update a form transporter", async () => {
    const user = await userFactory();
    const { mutate } = makeClient(user);
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const bsddTransporter = await prisma.bsddTransporter.create({
      data: {
        number: 0,
        readyToTakeOver: true,
        transporterCompanySiret: transporter.siret,
        transporterCompanyName: transporter.name,
        transporterTransportMode: "ROAD"
      }
    });
    const { errors, data } = await mutate<
      Pick<Mutation, "updateFormTransporter">,
      MutationUpdateFormTransporterArgs
    >(UPDATE_FORM_TRANSPORTER, {
      variables: {
        id: bsddTransporter.id,
        input: {
          mode: "RAIL"
        }
      }
    });
    expect(errors).toBeUndefined();

    const updatedBsddTransporter =
      await prisma.bsddTransporter.findUniqueOrThrow({
        where: { id: data.updateFormTransporter!.id }
      });

    expect(updatedBsddTransporter.transporterTransportMode).toEqual("RAIL");
  });

  it("should be possible to update the siret of an existing transporter", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        status: "SEALED"
      }
    });
    const bsddTransporter = await getFirstTransporter(form);
    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateFormTransporter">,
      MutationUpdateFormTransporterArgs
    >(UPDATE_FORM_TRANSPORTER, {
      variables: {
        id: bsddTransporter!.id,
        input: {
          company: { siret: transporter.siret }
        }
      }
    });
    expect(errors).toBeUndefined();
    const updatedBsddTransporter = await getFirstTransporter(form);
    expect(updatedBsddTransporter?.transporterCompanySiret).toEqual(
      transporter.siret
    );

    /// TODO vérifier ici que :
    // - transportersSirets est bien mis à jour
    // - le BSDD est réindexé
    // Le problème n'est pas très grave pour l'instant car depuis l'UI Trackdéchets l'update d'un
    // transporteur BSDD est toujours suivi d'un update BSDD qui met à jour `transporterSiets` et
    // réindexe le BSDD.
  });

  it("should throw error if data does not pass validation", async () => {
    const user = await userFactory();
    const { mutate } = makeClient(user);
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const bsddTransporter = await prisma.bsddTransporter.create({
      data: {
        number: 0,
        readyToTakeOver: true,
        transporterCompanySiret: transporter.siret,
        transporterCompanyName: transporter.name,
        transporterTransportMode: "ROAD"
      }
    });
    const { errors } = await mutate<
      Pick<Mutation, "updateFormTransporter">,
      MutationUpdateFormTransporterArgs
    >(UPDATE_FORM_TRANSPORTER, {
      variables: {
        id: bsddTransporter.id,
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

  it("should not be possible to update a transporter that has already signed", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        status: "SENT",
        transporters: {
          create: {
            transporterCompanySiret: transporter.siret,
            number: 1,
            readyToTakeOver: true,
            takenOverAt: new Date()
          }
        }
      }
    });
    const bsddTransporter = await getFirstTransporter(form);
    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateFormTransporter">,
      MutationUpdateFormTransporterArgs
    >(UPDATE_FORM_TRANSPORTER, {
      variables: {
        id: bsddTransporter!.id,
        input: {
          mode: "RAIL"
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

  it("should not allow a user not part of a form to update an associated transporter", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        status: "SENT",
        transporters: {
          create: {
            transporterCompanySiret: transporter.siret,
            number: 1
          }
        }
      }
    });
    const bsddTransporter = await getFirstTransporter(form);
    const randomUser = await userFactory();
    const { mutate } = makeClient(randomUser);
    const { errors } = await mutate<
      Pick<Mutation, "updateFormTransporter">,
      MutationUpdateFormTransporterArgs
    >(UPDATE_FORM_TRANSPORTER, {
      variables: {
        id: bsddTransporter!.id,
        input: {
          mode: "RAIL"
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas autorisé à modifier ce transporteur BSDD"
      })
    ]);
  });

  it("should not be possible for a transporter to remove himself from a BSDD", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER", {
      companyTypes: ["TRANSPORTER"]
    });
    const anotherTransporter = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        status: "SENT",
        transporters: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            number: 1
          }
        }
      }
    });
    const bsddTransporter = await getFirstTransporter(form);
    const { mutate } = makeClient(transporter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateFormTransporter">,
      MutationUpdateFormTransporterArgs
    >(UPDATE_FORM_TRANSPORTER, {
      variables: {
        id: bsddTransporter!.id,
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
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });

    const emitter = await userWithCompanyFactory("MEMBER");

    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        status: "SENT",
        transporters: {
          create: {
            transporterCompanySiret: transporter.siret,
            number: 1
          }
        }
      }
    });
    const bsddTransporter = await getFirstTransporter(form);

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

    const { mutate } = makeClientLocal({
      ...emitter.user,
      auth: AuthType.Bearer
    });

    const { errors, data } = await mutate<
      Pick<Mutation, "updateFormTransporter">,
      MutationUpdateFormTransporterArgs
    >(UPDATE_FORM_TRANSPORTER, {
      variables: {
        id: bsddTransporter!.id,
        input: {
          company: { siret: transporter2.siret }
        }
      }
    });

    expect(errors).toBeUndefined();

    expect(searchCompanyMock).toHaveBeenCalledWith(transporter2.siret);

    const updatedBsddTransporter =
      await prisma.bsddTransporter.findUniqueOrThrow({
        where: { id: data.updateFormTransporter!.id }
      });

    expect(updatedBsddTransporter.transporterCompanyName).toEqual(
      searchResult.name
    );
    expect(updatedBsddTransporter.transporterCompanyAddress).toEqual(
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
    const bsddTransporter = await prisma.bsddTransporter.create({
      data: {
        number: 0,
        readyToTakeOver: true,
        transporterCompanySiret: transporter.siret,
        transporterCompanyName: transporter.name,
        transporterTransportMode: "ROAD",
        transporterIsExemptedOfReceipt: true,
        transporterReceipt: null,
        transporterValidityLimit: null,
        transporterDepartment: null
      }
    });
    const { errors, data } = await mutate<
      Pick<Mutation, "updateFormTransporter">,
      MutationUpdateFormTransporterArgs
    >(UPDATE_FORM_TRANSPORTER, {
      variables: {
        id: bsddTransporter.id,
        input: {
          isExemptedOfReceipt: false
        }
      }
    });
    expect(errors).toBeUndefined();

    const updatedBsddTransporter =
      await prisma.bsddTransporter.findUniqueOrThrow({
        where: { id: data.updateFormTransporter!.id }
      });

    expect(updatedBsddTransporter.transporterReceipt).toEqual("MON-RECEPISSE");
    expect(updatedBsddTransporter.transporterDepartment).toEqual("13");
    expect(updatedBsddTransporter.transporterValidityLimit).toEqual(
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
    const bsddTransporter = await prisma.bsddTransporter.create({
      data: {
        number: 0,
        readyToTakeOver: true,
        transporterCompanySiret: transporter1.siret,
        transporterCompanyName: transporter1.name,
        transporterTransportMode: "ROAD",
        transporterIsExemptedOfReceipt: false,
        transporterReceipt: null,
        transporterValidityLimit: null,
        transporterDepartment: null
      }
    });
    const { errors, data } = await mutate<
      Pick<Mutation, "updateFormTransporter">,
      MutationUpdateFormTransporterArgs
    >(UPDATE_FORM_TRANSPORTER, {
      variables: {
        id: bsddTransporter.id,
        input: {
          company: { siret: transporter2.siret },
          receipt: "IGNORE-ME", // should not be be taken into account
          department: "IGNORE-ME", // should not be be taken into account
          validityLimit: new Date("2024-01-01").toISOString() as any // should not be be taken into account
        }
      }
    });
    expect(errors).toBeUndefined();
    const updatedBsddTransporter =
      await prisma.bsddTransporter.findUniqueOrThrow({
        where: { id: data.updateFormTransporter!.id }
      });

    expect(updatedBsddTransporter.transporterReceipt).toEqual(
      "MON-RECEPISSE-2"
    );
    expect(updatedBsddTransporter.transporterDepartment).toEqual("07");
    expect(updatedBsddTransporter.transporterValidityLimit).toEqual(
      new Date("2024-01-02")
    );
  });
});
