import { gql } from "graphql-tag";
import { prisma } from "@td/prisma";
import {
  bsddTransporterFactory,
  companyFactory,
  formFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import type {
  Mutation,
  MutationDeleteFormTransporterArgs
} from "@td/codegen-back";
import { getTransporters } from "../../../database";

const DELETE_FORM_TRANSPORTER = gql`
  mutation DeleteFormTransporter($id: ID!) {
    deleteFormTransporter(id: $id)
  }
`;

describe("Mutation.deleteFormTransporter", () => {
  it("should not allow a user not authenticated", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "deleteFormTransporter">,
      MutationDeleteFormTransporterArgs
    >(DELETE_FORM_TRANSPORTER, {
      variables: { id: "id" }
    });
    expect(errors).toEqual([
      expect.objectContaining({ message: "Vous n'êtes pas connecté." })
    ]);
  });

  it("should delete a transporter that is not yet part of a form", async () => {
    const company = await companyFactory();
    const transporter = await prisma.bsddTransporter.create({
      data: { number: 1, transporterCompanySiret: company.siret }
    });
    const user = await userFactory();
    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "deleteFormTransporter">,
      MutationDeleteFormTransporterArgs
    >(DELETE_FORM_TRANSPORTER, {
      variables: { id: transporter.id }
    });
    expect(data.deleteFormTransporter).toEqual(transporter.id);
    const deletedTransporter = await prisma.bsddTransporter.findUnique({
      where: { id: transporter.id }
    });
    expect(deletedTransporter).toBeNull();
  });

  it("should delete a transporter that is part of the form and recompute transporters ordering", async () => {
    const transporter1 = await companyFactory();
    const transporter2 = await companyFactory();
    const transporter3 = await companyFactory();
    const transporter4 = await companyFactory();

    const emitter = await userWithCompanyFactory("MEMBER");

    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        transporters: {
          create: { number: 1, transporterCompanySiret: transporter1.siret }
        }
      }
    });

    await bsddTransporterFactory({
      formId: form.id,
      opts: { transporterCompanySiret: transporter2.siret }
    });
    await bsddTransporterFactory({
      formId: form.id,
      opts: { transporterCompanySiret: transporter3.siret }
    });
    await bsddTransporterFactory({
      formId: form.id,
      opts: { transporterCompanySiret: transporter4.siret }
    });

    const transporters = await getTransporters(form);
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

    const bsddTransporter2 = transporters[1];

    const { mutate } = makeClient(emitter.user);

    const { data } = await mutate<
      Pick<Mutation, "deleteFormTransporter">,
      MutationDeleteFormTransporterArgs
    >(DELETE_FORM_TRANSPORTER, {
      variables: { id: bsddTransporter2.id } // delete second transporter
    });
    expect(data.deleteFormTransporter).toEqual(bsddTransporter2.id);
    const deletedTransporter2 = await prisma.bsddTransporter.findUnique({
      where: { id: bsddTransporter2.id }
    });
    expect(deletedTransporter2).toBeNull();

    const updatedTransporters = await getTransporters(form);
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

    const updatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });
    expect(updatedForm.transportersSirets).toEqual([
      transporter1.siret,
      transporter3.siret,
      transporter4.siret
    ]);
  });

  it("should not allow a user to delete a transporter from a form he is not part of", async () => {
    const transporter = await companyFactory();
    const emitter = await userWithCompanyFactory();
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        transporters: {
          create: { number: 1, transporterCompanySiret: transporter.siret }
        }
      }
    });
    const bsddTransporter = (await getTransporters(form))[0];

    const user = await userFactory();
    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "deleteFormTransporter">,
      MutationDeleteFormTransporterArgs
    >(DELETE_FORM_TRANSPORTER, {
      variables: { id: bsddTransporter.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas autorisé à modifier ce bordereau"
      })
    ]);
  });

  it("should not be possible to delete a form transporter that has already signed", async () => {
    const transporter = await companyFactory();
    const emitter = await userWithCompanyFactory();
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        status: "SENT",
        transporters: {
          create: {
            number: 1,
            transporterCompanySiret: transporter.siret,
            takenOverAt: new Date()
          }
        }
      }
    });
    const bsddTransporter = (await getTransporters(form))[0];
    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "deleteFormTransporter">,
      MutationDeleteFormTransporterArgs
    >(DELETE_FORM_TRANSPORTER, {
      variables: { id: bsddTransporter.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Ce transporteur BSDD ne peut être supprimé car il a déjà signé l'enlèvement du déchet"
      })
    ]);
  });
});
