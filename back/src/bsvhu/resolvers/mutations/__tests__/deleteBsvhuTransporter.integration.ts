import { gql } from "graphql-tag";
import { prisma } from "@td/prisma";
import {
  companyFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import type { Mutation, MutationDeleteBsvhuArgs } from "@td/codegen-back";
import { getTransporters } from "../../../database";
import {
  bsvhuFactory,
  bsvhuTransporterFactory
} from "../../../__tests__/factories.vhu";

const DELETE_BSVHU_TRANSPORTER = gql`
  mutation DeleteBsvhuTransporter($id: ID!) {
    deleteBsvhuTransporter(id: $id)
  }
`;

describe("Mutation.deleteBsvhuTransporter", () => {
  it("should not allow a user not authenticated", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "deleteBsvhuTransporter">,
      MutationDeleteBsvhuArgs
    >(DELETE_BSVHU_TRANSPORTER, {
      variables: { id: "id" }
    });
    expect(errors).toEqual([
      expect.objectContaining({ message: "Vous n'êtes pas connecté." })
    ]);
  });

  it("should delete a transporter that is not yet part of a BSVHU", async () => {
    const company = await companyFactory();
    const transporter = await prisma.bsvhuTransporter.create({
      data: { number: 1, transporterCompanySiret: company.siret }
    });
    const user = await userFactory();
    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "deleteBsvhuTransporter">,
      MutationDeleteBsvhuArgs
    >(DELETE_BSVHU_TRANSPORTER, {
      variables: { id: transporter.id }
    });
    expect(data.deleteBsvhuTransporter).toEqual(transporter.id);
    const deletedTransporter = await prisma.bsvhuTransporter.findUnique({
      where: { id: transporter.id }
    });
    expect(deletedTransporter).toBeNull();
  });

  it("should delete a transporter that is part of the BSVHU and recompute transporters ordering", async () => {
    const transporter1 = await companyFactory();
    const transporter2 = await companyFactory();
    const transporter3 = await companyFactory();
    const transporter4 = await companyFactory();

    const emitter = await userWithCompanyFactory("MEMBER");

    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        transporters: {
          create: { number: 1, transporterCompanySiret: transporter1.siret }
        }
      }
    });

    await bsvhuTransporterFactory({
      bsvhuId: bsvhu.id,
      opts: { transporterCompanySiret: transporter2.siret }
    });
    await bsvhuTransporterFactory({
      bsvhuId: bsvhu.id,
      opts: { transporterCompanySiret: transporter3.siret }
    });
    await bsvhuTransporterFactory({
      bsvhuId: bsvhu.id,
      opts: { transporterCompanySiret: transporter4.siret }
    });

    const transporters = await getTransporters(bsvhu);
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

    const bsvhuTransporter2 = transporters[1];

    const { mutate } = makeClient(emitter.user);

    const { data } = await mutate<
      Pick<Mutation, "deleteBsvhuTransporter">,
      MutationDeleteBsvhuArgs
    >(DELETE_BSVHU_TRANSPORTER, {
      variables: { id: bsvhuTransporter2.id } // delete second transporter
    });
    expect(data.deleteBsvhuTransporter).toEqual(bsvhuTransporter2.id);
    const deletedTransporter2 = await prisma.bsvhuTransporter.findUnique({
      where: { id: bsvhuTransporter2.id }
    });
    expect(deletedTransporter2).toBeNull();

    const updatedTransporters = await getTransporters(bsvhu);

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

    const updatedBsvhu = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id }
    });
    expect(updatedBsvhu.transportersOrgIds).toEqual([
      transporter1.siret,
      transporter3.siret,
      transporter4.siret
    ]);
  });

  it("should not allow a user to delete a transporter from a BSVHU he is not part of", async () => {
    const transporter = await companyFactory();
    const emitter = await userWithCompanyFactory();
    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        transporters: {
          create: { number: 1, transporterCompanySiret: transporter.siret }
        }
      }
    });
    const bsvhuTransporter = (await getTransporters(bsvhu))[0];

    const user = await userFactory();
    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "deleteBsvhuTransporter">,
      MutationDeleteBsvhuArgs
    >(DELETE_BSVHU_TRANSPORTER, {
      variables: { id: bsvhuTransporter.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Votre établissement doit être visé sur le bordereau"
      })
    ]);
  });

  it("should not be possible to delete a BSVHU transporter that has already signed", async () => {
    const transporter = await companyFactory();
    const emitter = await userWithCompanyFactory();
    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        status: "SENT",
        transporters: {
          create: {
            number: 1,
            transporterCompanySiret: transporter.siret,
            transporterTransportSignatureDate: new Date()
          }
        }
      }
    });
    const bsvhuTransporter = (await getTransporters(bsvhu))[0];
    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "deleteBsvhuTransporter">,
      MutationDeleteBsvhuArgs
    >(DELETE_BSVHU_TRANSPORTER, {
      variables: { id: bsvhuTransporter.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Ce transporteur BSVHU ne peut être supprimé car il a déjà signé l'enlèvement du déchet"
      })
    ]);
  });
});
