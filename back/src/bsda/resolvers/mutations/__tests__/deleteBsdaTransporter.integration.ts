import { gql } from "graphql-tag";
import { prisma } from "@td/prisma";
import {
  companyFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { Mutation, MutationDeleteBsdaArgs } from "@td/codegen-back";
import { getTransporters } from "../../../database";
import {
  bsdaFactory,
  bsdaTransporterFactory
} from "../../../__tests__/factories";

const DELETE_BSDA_TRANSPORTER = gql`
  mutation deleteBsdaTransporter($id: ID!) {
    deleteBsdaTransporter(id: $id)
  }
`;

describe("Mutation.deleteBsdaTransporter", () => {
  it("should not allow a user not authenticated", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "deleteBsdaTransporter">,
      MutationDeleteBsdaArgs
    >(DELETE_BSDA_TRANSPORTER, {
      variables: { id: "id" }
    });
    expect(errors).toEqual([
      expect.objectContaining({ message: "Vous n'êtes pas connecté." })
    ]);
  });

  it("should delete a transporter that is not yet part of a BSDA", async () => {
    const company = await companyFactory();
    const transporter = await prisma.bsdaTransporter.create({
      data: { number: 1, transporterCompanySiret: company.siret }
    });
    const user = await userFactory();
    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "deleteBsdaTransporter">,
      MutationDeleteBsdaArgs
    >(DELETE_BSDA_TRANSPORTER, {
      variables: { id: transporter.id }
    });
    expect(data.deleteBsdaTransporter).toEqual(transporter.id);
    const deletedTransporter = await prisma.bsdaTransporter.findUnique({
      where: { id: transporter.id }
    });
    expect(deletedTransporter).toBeNull();
  });

  it("should delete a transporter that is part of the BSDA and recompute transporters ordering", async () => {
    const transporter1 = await companyFactory();
    const transporter2 = await companyFactory();
    const transporter3 = await companyFactory();
    const transporter4 = await companyFactory();

    const emitter = await userWithCompanyFactory("MEMBER");

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret
      },
      transporterOpt: {
        transporterCompanySiret: transporter1.siret
      }
    });

    await bsdaTransporterFactory({
      bsdaId: bsda.id,
      opts: { transporterCompanySiret: transporter2.siret }
    });
    await bsdaTransporterFactory({
      bsdaId: bsda.id,
      opts: { transporterCompanySiret: transporter3.siret }
    });
    await bsdaTransporterFactory({
      bsdaId: bsda.id,
      opts: { transporterCompanySiret: transporter4.siret }
    });

    const transporters = await getTransporters(bsda);
    expect(transporters).toEqual([
      expect.objectContaining({
        number: 1,
        transporterCompanySiret: transporter1.siret
      }),
      expect.objectContaining({
        number: 2,
        transporterCompanySiret: transporter2.siret
      }),
      expect.objectContaining({
        number: 3,
        transporterCompanySiret: transporter3.siret
      }),
      expect.objectContaining({
        number: 4,
        transporterCompanySiret: transporter4.siret
      })
    ]);

    const bsdaTransporter2 = transporters[1];

    const { mutate } = makeClient(emitter.user);

    const { data } = await mutate<
      Pick<Mutation, "deleteBsdaTransporter">,
      MutationDeleteBsdaArgs
    >(DELETE_BSDA_TRANSPORTER, {
      variables: { id: bsdaTransporter2.id } // delete second transporter
    });
    expect(data.deleteBsdaTransporter).toEqual(bsdaTransporter2.id);
    const deletedTransporter2 = await prisma.bsdaTransporter.findUnique({
      where: { id: bsdaTransporter2.id }
    });
    expect(deletedTransporter2).toBeNull();

    const updatedTransporters = await getTransporters(bsda);

    expect(updatedTransporters).toEqual([
      expect.objectContaining({
        number: 1,
        transporterCompanySiret: transporter1.siret
      }),
      expect.objectContaining({
        number: 2, // ordering has been updated
        transporterCompanySiret: transporter3.siret
      }),
      expect.objectContaining({
        number: 3, // ordering has been updated
        transporterCompanySiret: transporter4.siret
      })
    ]);

    const updatedBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id }
    });
    expect(updatedBsda.transportersOrgIds).toEqual([
      transporter1.siret,
      transporter3.siret,
      transporter4.siret
    ]);
  });

  it("should not allow a user to delete a transporter from a BSDA he is not part of", async () => {
    const transporter = await companyFactory();
    const emitter = await userWithCompanyFactory();
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret
      },
      transporterOpt: {
        transporterCompanySiret: transporter.siret
      }
    });
    const bsdaTransporter = (await getTransporters(bsda))[0];

    const user = await userFactory();
    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "deleteBsdaTransporter">,
      MutationDeleteBsdaArgs
    >(DELETE_BSDA_TRANSPORTER, {
      variables: { id: bsdaTransporter.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas"
      })
    ]);
  });

  it("should not be possible to delete a BSDA transporter that has already signed", async () => {
    const transporter = await companyFactory();
    const emitter = await userWithCompanyFactory();
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        status: "SENT"
      },
      transporterOpt: {
        transporterCompanySiret: transporter.siret,
        transporterTransportSignatureDate: new Date()
      }
    });
    const bsdaTransporter = (await getTransporters(bsda))[0];
    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "deleteBsdaTransporter">,
      MutationDeleteBsdaArgs
    >(DELETE_BSDA_TRANSPORTER, {
      variables: { id: bsdaTransporter.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Ce transporteur BSDA ne peut être supprimé car il a déjà signé l'enlèvement du déchet"
      })
    ]);
  });
});
