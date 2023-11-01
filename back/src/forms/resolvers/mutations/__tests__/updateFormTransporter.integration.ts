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
        message: "Vous n'êtes pas autorisé à modifier ce bordereau"
      })
    ]);
  });
});