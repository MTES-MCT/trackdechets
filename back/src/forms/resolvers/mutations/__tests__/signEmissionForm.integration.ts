import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationSignEmissionFormArgs
} from "../../../../generated/graphql/types";
import {
  formFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const SIGN_EMISSION_FORM = `
  mutation SignEmissionForm($id: ID!, $input: SignEmissionFormInput!, $securityCode: Int) {
    signEmissionForm(id: $id, input: $input, securityCode: $securityCode) {
      id
      status
      signedByTransporter
      sentAt
      sentBy
      emittedAt
      emittedBy
      emittedByEcoOrganisme
      temporaryStorageDetail {
        signedAt
        signedBy
        emittedAt
        emittedBy
      }
    }
  }
`;

describe("signEmissionForm", () => {
  afterAll(resetDatabase);

  it("should sign emission", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "SEALED",
        signedByTransporter: null,
        sentAt: null,
        sentBy: null,
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name
      }
    });
    const emittedAt = new Date("2018-12-11T00:00:00.000Z");

    const { mutate } = makeClient(emitter.user);
    const { errors, data } = await mutate<
      Pick<Mutation, "signEmissionForm">,
      MutationSignEmissionFormArgs
    >(SIGN_EMISSION_FORM, {
      variables: {
        id: form.id,
        input: {
          emittedAt: emittedAt.toISOString() as unknown as Date,
          emittedBy: emitter.user.name,
          quantity: 1
        }
      }
    });

    expect(errors).toBeUndefined();
    expect(data.signEmissionForm).toEqual(
      expect.objectContaining({
        status: "SIGNED_BY_PRODUCER",

        signedByTransporter: null,
        sentAt: null,
        sentBy: null,

        emittedAt: emittedAt.toISOString(),
        emittedBy: emitter.user.name,
        emittedByEcoOrganisme: false
      })
    );
  });

  it("should throw an error if the form can't be signed", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name
      }
    });

    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "signEmissionForm">,
      MutationSignEmissionFormArgs
    >(SIGN_EMISSION_FORM, {
      variables: {
        id: form.id,
        input: {
          emittedAt: "2018-12-11T00:00:00.000Z" as unknown as Date,
          emittedBy: emitter.user.name,
          quantity: 1
        }
      }
    });

    expect(errors).not.toBeUndefined();
  });

  it("should sign emission via emitter's security code", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "SEALED",
        signedByTransporter: null,
        sentAt: null,
        sentBy: null,
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name,
        transporterCompanySiret: transporter.company.siret,
        transporterCompanyName: transporter.company.name
      }
    });
    const emittedAt = new Date("2018-12-11T00:00:00.000Z");

    const { mutate } = makeClient(transporter.user);
    const { errors, data } = await mutate<
      Pick<Mutation, "signEmissionForm">,
      MutationSignEmissionFormArgs
    >(SIGN_EMISSION_FORM, {
      variables: {
        id: form.id,
        input: {
          emittedAt: emittedAt.toISOString() as unknown as Date,
          emittedBy: emitter.user.name,
          quantity: 1
        },
        securityCode: emitter.company.securityCode
      }
    });

    expect(errors).toBeUndefined();
    expect(data.signEmissionForm).toEqual(
      expect.objectContaining({
        status: "SIGNED_BY_PRODUCER",

        signedByTransporter: null,
        sentAt: null,
        sentBy: null,

        emittedAt: emittedAt.toISOString(),
        emittedBy: emitter.user.name,
        emittedByEcoOrganisme: false
      })
    );
  });

  it("should throw an error if emitter's security code is invalid", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "SEALED",
        signedByTransporter: null,
        sentAt: null,
        sentBy: null,
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name,
        transporterCompanySiret: transporter.company.siret,
        transporterCompanyName: transporter.company.name
      }
    });

    const { mutate } = makeClient(transporter.user);
    const { errors } = await mutate<
      Pick<Mutation, "signEmissionForm">,
      MutationSignEmissionFormArgs
    >(SIGN_EMISSION_FORM, {
      variables: {
        id: form.id,
        input: {
          emittedAt: "2018-12-11T00:00:00.000Z" as unknown as Date,
          emittedBy: emitter.user.name,
          quantity: 1
        },
        securityCode: 9999
      }
    });

    expect(errors).not.toBeUndefined();
  });

  it("should sign emission for the eco organisme", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const ecoOrganisme = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "SEALED",
        signedByTransporter: null,
        sentAt: null,
        sentBy: null,
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name,
        ecoOrganismeSiret: ecoOrganisme.company.siret,
        ecoOrganismeName: ecoOrganisme.company.name
      }
    });
    const emittedAt = new Date("2018-12-11T00:00:00.000Z");

    const { mutate } = makeClient(ecoOrganisme.user);
    const { errors, data } = await mutate<
      Pick<Mutation, "signEmissionForm">,
      MutationSignEmissionFormArgs
    >(SIGN_EMISSION_FORM, {
      variables: {
        id: form.id,
        input: {
          emittedAt: emittedAt.toISOString() as unknown as Date,
          emittedBy: emitter.user.name,
          emittedByEcoOrganisme: true,
          quantity: 1
        }
      }
    });

    expect(errors).toBeUndefined();
    expect(data.signEmissionForm).toEqual(
      expect.objectContaining({
        status: "SIGNED_BY_PRODUCER",

        signedByTransporter: null,
        sentAt: null,
        sentBy: null,

        emittedAt: emittedAt.toISOString(),
        emittedBy: emitter.user.name,
        emittedByEcoOrganisme: true
      })
    );
  });

  it("should sign emission via eco organisme's security code", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const ecoOrganisme = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "SEALED",
        signedByTransporter: null,
        sentAt: null,
        sentBy: null,
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name,
        transporterCompanySiret: transporter.company.siret,
        transporterCompanyName: transporter.company.name,
        ecoOrganismeSiret: ecoOrganisme.company.siret,
        ecoOrganismeName: ecoOrganisme.company.name
      }
    });
    const emittedAt = new Date("2018-12-11T00:00:00.000Z");

    const { mutate } = makeClient(transporter.user);
    const { errors, data } = await mutate<
      Pick<Mutation, "signEmissionForm">,
      MutationSignEmissionFormArgs
    >(SIGN_EMISSION_FORM, {
      variables: {
        id: form.id,
        input: {
          emittedAt: emittedAt.toISOString() as unknown as Date,
          emittedBy: emitter.user.name,
          emittedByEcoOrganisme: true,
          quantity: 1
        },
        securityCode: ecoOrganisme.company.securityCode
      }
    });

    expect(errors).toBeUndefined();
    expect(data.signEmissionForm).toEqual(
      expect.objectContaining({
        status: "SIGNED_BY_PRODUCER",

        signedByTransporter: null,
        sentAt: null,
        sentBy: null,

        emittedAt: emittedAt.toISOString(),
        emittedBy: emitter.user.name,
        emittedByEcoOrganisme: true
      })
    );
  });

  it("should throw an error if eco organisme's security code is invalid", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const ecoOrganisme = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "SEALED",
        signedByTransporter: null,
        sentAt: null,
        sentBy: null,
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name,
        transporterCompanySiret: transporter.company.siret,
        transporterCompanyName: transporter.company.name,
        ecoOrganismeSiret: ecoOrganisme.company.siret,
        ecoOrganismeName: ecoOrganisme.company.name
      }
    });
    const emittedAt = new Date("2018-12-11T00:00:00.000Z");

    const { mutate } = makeClient(transporter.user);
    const { errors } = await mutate<
      Pick<Mutation, "signEmissionForm">,
      MutationSignEmissionFormArgs
    >(SIGN_EMISSION_FORM, {
      variables: {
        id: form.id,
        input: {
          emittedAt: emittedAt.toISOString() as unknown as Date,
          emittedBy: emitter.user.name,
          emittedByEcoOrganisme: true,
          quantity: 1
        },
        securityCode: 9999
      }
    });

    expect(errors).not.toBeUndefined();
  });

  it("should sign emission for the temporary storage", async () => {
    const temporaryStorage = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: temporaryStorage.user.id,
      opt: {
        status: "RESEALED",
        recipientCompanySiret: temporaryStorage.company.siret,
        recipientCompanyName: temporaryStorage.company.name,
        temporaryStorageDetail: {
          create: {}
        }
      }
    });
    const emittedAt = new Date("2018-12-11T00:00:00.000Z");

    const { mutate } = makeClient(temporaryStorage.user);
    const { errors, data } = await mutate<
      Pick<Mutation, "signEmissionForm">,
      MutationSignEmissionFormArgs
    >(SIGN_EMISSION_FORM, {
      variables: {
        id: form.id,
        input: {
          emittedAt: emittedAt.toISOString() as unknown as Date,
          emittedBy: temporaryStorage.user.name,
          quantity: 1
        }
      }
    });

    expect(errors).toBeUndefined();
    expect(data.signEmissionForm).toEqual(
      expect.objectContaining({
        status: "SIGNED_BY_TEMP_STORER",
        temporaryStorageDetail: expect.objectContaining({
          signedAt: null,
          signedBy: null,
          emittedAt: emittedAt.toISOString(),
          emittedBy: temporaryStorage.user.name
        })
      })
    );
  });

  it("should sign emission via temporary storage's security code", async () => {
    const temporaryStorage = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: temporaryStorage.user.id,
      opt: {
        status: "RESEALED",
        recipientCompanySiret: temporaryStorage.company.siret,
        recipientCompanyName: temporaryStorage.company.name,
        temporaryStorageDetail: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            transporterCompanyName: transporter.company.name
          }
        }
      }
    });
    const emittedAt = new Date("2018-12-11T00:00:00.000Z");

    const { mutate } = makeClient(transporter.user);
    const { errors, data } = await mutate<
      Pick<Mutation, "signEmissionForm">,
      MutationSignEmissionFormArgs
    >(SIGN_EMISSION_FORM, {
      variables: {
        id: form.id,
        input: {
          emittedAt: emittedAt.toISOString() as unknown as Date,
          emittedBy: temporaryStorage.user.name,
          quantity: 1
        },
        securityCode: temporaryStorage.company.securityCode
      }
    });

    expect(errors).toBeUndefined();
    expect(data.signEmissionForm).toEqual(
      expect.objectContaining({
        status: "SIGNED_BY_TEMP_STORER",
        temporaryStorageDetail: expect.objectContaining({
          signedAt: null,
          signedBy: null,
          emittedAt: emittedAt.toISOString(),
          emittedBy: temporaryStorage.user.name
        })
      })
    );
  });

  it("should throw an error if temporary storage's security code is invalid", async () => {
    const temporaryStorage = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: temporaryStorage.user.id,
      opt: {
        status: "RESEALED",
        recipientCompanySiret: temporaryStorage.company.siret,
        recipientCompanyName: temporaryStorage.company.name,
        temporaryStorageDetail: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            transporterCompanyName: transporter.company.name
          }
        }
      }
    });
    const emittedAt = new Date("2018-12-11T00:00:00.000Z");

    const { mutate } = makeClient(transporter.user);
    const { errors } = await mutate<
      Pick<Mutation, "signEmissionForm">,
      MutationSignEmissionFormArgs
    >(SIGN_EMISSION_FORM, {
      variables: {
        id: form.id,
        input: {
          emittedAt: emittedAt.toISOString() as unknown as Date,
          emittedBy: temporaryStorage.user.name,
          quantity: 1
        },
        securityCode: 9999
      }
    });

    expect(errors).not.toBeUndefined();
  });
});
