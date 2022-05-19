import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import {
  formFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { Status as FormStatus } from "@prisma/client";
jest.mock("axios", () => ({
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} }))
  }
}));

describe("Forms -> updateTransporterFields mutation", () => {
  afterEach(resetDatabase);

  it.each([FormStatus.SEALED, FormStatus.SIGNED_BY_PRODUCER])(
    "should update transporter plate (%p status)",
    async status => {
      const { user: emitter } = await userWithCompanyFactory("MEMBER");
      const { user: transporter, company: transporterCompany } =
        await userWithCompanyFactory("MEMBER");

      let form = await formFactory({
        ownerId: emitter.id,
        opt: {
          status,
          transporterCompanySiret: transporterCompany.siret
        }
      });
      const { mutate } = makeClient(transporter);
      const mutation = `
    mutation {
      updateTransporterFields(id: "${form.id}", transporterNumberPlate: "ZBLOP 83") {
        id
      }
    }
  `;
      await mutate(mutation);

      form = await prisma.form.findUnique({
        where: { id: form.id },
        include: { forwardedIn: true }
      });

      expect(form.transporterNumberPlate).toEqual("ZBLOP 83");
    }
  );

  it.each([FormStatus.SEALED, FormStatus.SIGNED_BY_PRODUCER])(
    "should update transporter custom info (%p status)",
    async status => {
      const { user: emitter } = await userWithCompanyFactory("MEMBER");
      const { user: transporter, company: transporterCompany } =
        await userWithCompanyFactory("MEMBER");

      let form = await formFactory({
        ownerId: emitter.id,
        opt: {
          status,
          transporterCompanySiret: transporterCompany.siret
        }
      });
      const { mutate } = makeClient(transporter);
      const mutation = `
    mutation {
      updateTransporterFields(id: "${form.id}", transporterCustomInfo: "tournée 493") {
        id
      }
    }
  `;
      await mutate(mutation);

      form = await prisma.form.findUnique({
        where: { id: form.id },
        include: { forwardedIn: true }
      });

      expect(form.transporterCustomInfo).toEqual("tournée 493");
    }
  );

  it("should not update not SEALED forms", async () => {
    const { user: emitter } = await userWithCompanyFactory("MEMBER");
    const { user: transporter, company: transporterCompany } =
      await userWithCompanyFactory("MEMBER");

    let form = await formFactory({
      ownerId: emitter.id,
      opt: {
        status: "SENT",
        transporterCompanySiret: transporterCompany.siret
      }
    });
    const { mutate } = makeClient(transporter);
    const mutation = `
    mutation {
      updateTransporterFields(id: "${form.id}", transporterCustomInfo: "tournée 493") {
        id
      }
    }
  `;
    const { errors } = await mutate(mutation);
    expect(errors[0].message).toEqual(
      "Ce champ n'est pas modifiable sur un bordereau qui n'est pas en statut scellé ou signé par le producteur"
    );

    form = await prisma.form.findUnique({
      where: { id: form.id },
      include: { forwardedIn: true }
    });

    expect(form.transporterCustomInfo).toEqual(null);
  });

  it("should not update form if user is not made by a transporter", async () => {
    const { user: emitter } = await userWithCompanyFactory("MEMBER");
    const { company: transporterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    let form = await formFactory({
      ownerId: emitter.id,
      opt: {
        status: "SEALED",
        transporterCompanySiret: transporterCompany.siret
      }
    });
    const { mutate } = makeClient(emitter); // not a transporter
    const mutation = `
    mutation {
      updateTransporterFields(id: "${form.id}", transporterCustomInfo: "tournée 493") {
        id
      }
    }
  `;
    const { errors } = await mutate(mutation);

    expect(errors[0].message).toEqual(
      "Vous n'êtes pas transporteur de ce bordereau."
    );

    form = await prisma.form.findUnique({
      where: { id: form.id },
      include: { forwardedIn: true }
    });

    expect(form.transporterCustomInfo).toEqual(null);
  });
});
