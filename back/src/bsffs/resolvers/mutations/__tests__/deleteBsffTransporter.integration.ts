import { gql } from "graphql-tag";
import { prisma } from "@td/prisma";
import {
  companyFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  Mutation,
  MutationDeleteBsffArgs
} from "../../../../generated/graphql/types";
import { getTransporters } from "../../../database";
import {
  addBsffTransporter,
  createBsff,
  createBsffAfterTransport,
  createBsffBeforeEmission
} from "../../../__tests__/factories";

const DELETE_BSFF_TRANSPORTER = gql`
  mutation deleteBsffTransporter($id: ID!) {
    deleteBsffTransporter(id: $id)
  }
`;

describe("Mutation.deleteBsffTransporter", () => {
  it("should not allow a user not authenticated", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "deleteBsffTransporter">,
      MutationDeleteBsffArgs
    >(DELETE_BSFF_TRANSPORTER, {
      variables: { id: "id" }
    });
    expect(errors).toEqual([
      expect.objectContaining({ message: "Vous n'êtes pas connecté." })
    ]);
  });

  it("should delete a transporter that is not yet part of a BSFF", async () => {
    const company = await companyFactory();
    const transporter = await prisma.bsffTransporter.create({
      data: { number: 1, transporterCompanySiret: company.siret }
    });
    const user = await userFactory();
    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "deleteBsffTransporter">,
      MutationDeleteBsffArgs
    >(DELETE_BSFF_TRANSPORTER, {
      variables: { id: transporter.id }
    });
    expect(data.deleteBsffTransporter).toEqual(transporter.id);
    const deletedTransporter = await prisma.bsffTransporter.findUnique({
      where: { id: transporter.id }
    });
    expect(deletedTransporter).toBeNull();
  });

  it("should delete a transporter that is part of the BSFF and recompute transporters ordering", async () => {
    const transporter1 = await userWithCompanyFactory("MEMBER", {
      companyTypes: ["TRANSPORTER"]
    });
    const transporter2 = await userWithCompanyFactory("MEMBER", {
      companyTypes: ["TRANSPORTER"]
    });
    const transporter3 = await userWithCompanyFactory("MEMBER", {
      companyTypes: ["TRANSPORTER"]
    });
    const transporter4 = await userWithCompanyFactory("MEMBER", {
      companyTypes: ["TRANSPORTER"]
    });

    const emitter = await userWithCompanyFactory("MEMBER");

    const bsff = await createBsff({ transporter: transporter1, emitter });

    await addBsffTransporter({ bsffId: bsff.id, transporter: transporter2 });
    await addBsffTransporter({ bsffId: bsff.id, transporter: transporter3 });
    await addBsffTransporter({ bsffId: bsff.id, transporter: transporter4 });

    const transporters = await getTransporters(bsff);
    expect(transporters).toEqual([
      expect.objectContaining({
        number: 1,
        transporterCompanySiret: transporter1.company.siret
      }),
      expect.objectContaining({
        number: 2,
        transporterCompanySiret: transporter2.company.siret
      }),
      expect.objectContaining({
        number: 3,
        transporterCompanySiret: transporter3.company.siret
      }),
      expect.objectContaining({
        number: 4,
        transporterCompanySiret: transporter4.company.siret
      })
    ]);

    const bsffTransporter2 = transporters[1];

    const { mutate } = makeClient(emitter.user);

    const { data } = await mutate<
      Pick<Mutation, "deleteBsffTransporter">,
      MutationDeleteBsffArgs
    >(DELETE_BSFF_TRANSPORTER, {
      variables: { id: bsffTransporter2.id } // delete second transporter
    });
    expect(data.deleteBsffTransporter).toEqual(bsffTransporter2.id);
    const deletedTransporter2 = await prisma.bsffTransporter.findUnique({
      where: { id: bsffTransporter2.id }
    });
    expect(deletedTransporter2).toBeNull();

    const updatedTransporters = await getTransporters(bsff);

    expect(updatedTransporters).toEqual([
      expect.objectContaining({
        number: 1,
        transporterCompanySiret: transporter1.company.siret
      }),
      expect.objectContaining({
        number: 2, // ordering has been updated
        transporterCompanySiret: transporter3.company.siret
      }),
      expect.objectContaining({
        number: 3, // ordering has been updated
        transporterCompanySiret: transporter4.company.siret
      })
    ]);

    const updatedBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id }
    });
    expect(updatedBsff.transportersOrgIds).toEqual([
      transporter1.company.siret,
      transporter3.company.siret,
      transporter4.company.siret
    ]);
  });

  it("should not allow a user to delete a transporter from a BSFF he is not part of", async () => {
    const transporter = await userWithCompanyFactory();
    const emitter = await userWithCompanyFactory();
    const destination = await userWithCompanyFactory();

    const bsff = await createBsffBeforeEmission({
      emitter,
      transporter,
      destination
    });
    const bsffTransporter = (await getTransporters(bsff))[0];

    const user = await userFactory();
    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "deleteBsffTransporter">,
      MutationDeleteBsffArgs
    >(DELETE_BSFF_TRANSPORTER, {
      variables: { id: bsffTransporter.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas éditer un bordereau sur lequel le SIRET de votre entreprise n'apparaît pas."
      })
    ]);
  });

  it("should not be possible to delete a BSFF transporter that has already signed", async () => {
    const transporter = await userWithCompanyFactory();
    const emitter = await userWithCompanyFactory();
    const destination = await userWithCompanyFactory();
    const bsff = await createBsffAfterTransport({
      emitter,
      transporter,
      destination
    });
    const bsffTransporter = (await getTransporters(bsff))[0];
    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "deleteBsffTransporter">,
      MutationDeleteBsffArgs
    >(DELETE_BSFF_TRANSPORTER, {
      variables: { id: bsffTransporter.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Ce transporteur BSFF ne peut être supprimé car il a déjà signé l'enlèvement du déchet"
      })
    ]);
  });
});
