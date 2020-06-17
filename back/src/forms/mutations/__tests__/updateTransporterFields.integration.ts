import { resetDatabase } from "../../../../integration-tests/helper";
import { prisma } from "../../../generated/prisma-client";

import {
  formFactory,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import makeClient from "../../../__tests__/testClient";

jest.mock("axios", () => ({
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} }))
  }
}));

describe("Forms -> updateTransporterFields mutation", () => {
  beforeEach(async () => {
    await resetDatabase();
  });
  afterAll(async () => {
    await resetDatabase();
  });

  it("should update transporter plate", async () => {
    const { user: emitter } = await userWithCompanyFactory("MEMBER");
    const {
      user: transporter,
      company: transporterCompany
    } = await userWithCompanyFactory("MEMBER");

    let form = await formFactory({
      ownerId: emitter.id,
      opt: {
        status: "SEALED",
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

    form = await prisma.form({ id: form.id });

    expect(form.transporterNumberPlate).toEqual("ZBLOP 83");
  });

  it("should update transporter custom info", async () => {
    const { user: emitter } = await userWithCompanyFactory("MEMBER");
    const {
      user: transporter,
      company: transporterCompany
    } = await userWithCompanyFactory("MEMBER");

    let form = await formFactory({
      ownerId: emitter.id,
      opt: {
        status: "SEALED",
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

    form = await prisma.form({ id: form.id });

    expect(form.transporterCustomInfo).toEqual("tournée 493");
  });

  it("should not update not SEALED forms", async () => {
    const { user: emitter } = await userWithCompanyFactory("MEMBER");
    const {
      user: transporter,
      company: transporterCompany
    } = await userWithCompanyFactory("MEMBER");

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
      "Ce champ n'est pas modifiable sur un bordereau qui n'est pas en statut scellé"
    );

    form = await prisma.form({ id: form.id });

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

    form = await prisma.form({ id: form.id });

    expect(form.transporterCustomInfo).toEqual(null);
  });
});
