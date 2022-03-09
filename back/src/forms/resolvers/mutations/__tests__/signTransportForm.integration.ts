import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationSignTransportFormArgs
} from "../../../../generated/graphql/types";
import {
  formFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const SIGN_TRANSPORT_FORM = `
  mutation SignTransportForm($id: ID!, $input: SignTransportFormInput!, $securityCode: Int) {
    signTransportForm(id: $id, input: $input, securityCode: $securityCode) {
      id
      status
      signedByTransporter
      sentAt
      sentBy
      takenOverAt
      takenOverBy
      temporaryStorageDetail {
        signedAt
        signedBy
        takenOverAt
        takenOverBy
      }
    }
  }
`;

describe("signTransportForm", () => {
  afterAll(resetDatabase);

  it("should sign transport", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("ADMIN");
    const emittedAt = new Date("2018-12-11T00:00:00.000Z");
    const takenOverAt = new Date("2018-12-12T00:00:00.000Z");
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name,
        transporterCompanySiret: transporter.company.siret,
        transporterCompanyName: transporter.company.name,
        signedByTransporter: null,
        sentAt: null,
        sentBy: null,
        emittedAt: emittedAt,
        emittedBy: emitter.user.name
      }
    });

    const { mutate } = makeClient(transporter.user);
    const { errors, data } = await mutate<
      Pick<Mutation, "signTransportForm">,
      MutationSignTransportFormArgs
    >(SIGN_TRANSPORT_FORM, {
      variables: {
        id: form.id,
        input: {
          takenOverAt: takenOverAt.toISOString() as unknown as Date,
          takenOverBy: transporter.user.name
        }
      }
    });

    expect(errors).toBeUndefined();
    expect(data.signTransportForm).toEqual(
      expect.objectContaining({
        status: "SENT",

        signedByTransporter: true,
        sentAt: takenOverAt.toISOString(),
        sentBy: emitter.user.name,

        takenOverAt: takenOverAt.toISOString(),
        takenOverBy: transporter.user.name
      })
    );
  });

  it("should sign transport with security code", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("ADMIN");
    const emittedAt = new Date("2018-12-11T00:00:00.000Z");
    const takenOverAt = new Date("2018-12-12T00:00:00.000Z");
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name,
        transporterCompanySiret: transporter.company.siret,
        transporterCompanyName: transporter.company.name,
        signedByTransporter: null,
        sentAt: null,
        sentBy: null,
        emittedAt: emittedAt,
        emittedBy: emitter.user.name
      }
    });

    const { mutate } = makeClient(emitter.user);
    const { errors, data } = await mutate<
      Pick<Mutation, "signTransportForm">,
      MutationSignTransportFormArgs
    >(SIGN_TRANSPORT_FORM, {
      variables: {
        id: form.id,
        input: {
          takenOverAt: takenOverAt.toISOString() as unknown as Date,
          takenOverBy: transporter.user.name
        },
        securityCode: transporter.company.securityCode
      }
    });

    expect(errors).toBeUndefined();
    expect(data.signTransportForm).toEqual(
      expect.objectContaining({
        status: "SENT",

        signedByTransporter: true,
        sentAt: takenOverAt.toISOString(),
        sentBy: emitter.user.name,

        takenOverAt: takenOverAt.toISOString(),
        takenOverBy: transporter.user.name
      })
    );
  });

  it("should throw an error if transporter security code is invalid", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("ADMIN");
    const emittedAt = new Date("2018-12-11T00:00:00.000Z");
    const takenOverAt = new Date("2018-12-12T00:00:00.000Z");
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name,
        transporterCompanySiret: transporter.company.siret,
        transporterCompanyName: transporter.company.name,
        signedByTransporter: null,
        sentAt: null,
        sentBy: null,
        emittedAt: emittedAt,
        emittedBy: emitter.user.name
      }
    });

    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "signTransportForm">,
      MutationSignTransportFormArgs
    >(SIGN_TRANSPORT_FORM, {
      variables: {
        id: form.id,
        input: {
          takenOverAt: takenOverAt.toISOString() as unknown as Date,
          takenOverBy: transporter.user.name
        },
        securityCode: 9999
      }
    });

    expect(errors).not.toBeUndefined();
  });

  it("should sign transport from temporary storage", async () => {
    const temporaryStorage = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("ADMIN");
    const emittedAt = new Date("2018-12-11T00:00:00.000Z");
    const takenOverAt = new Date("2018-12-12T00:00:00.000Z");
    const form = await formFactory({
      ownerId: temporaryStorage.user.id,
      opt: {
        status: "SIGNED_BY_TEMP_STORER",
        recipientCompanySiret: temporaryStorage.company.siret,
        recipientCompanyName: temporaryStorage.company.name,
        temporaryStorageDetail: {
          create: {
            emittedAt: emittedAt,
            emittedBy: temporaryStorage.user.name,
            transporterCompanySiret: transporter.company.siret,
            transporterCompanyName: transporter.company.name
          }
        }
      }
    });

    const { mutate } = makeClient(transporter.user);
    const { errors, data } = await mutate<
      Pick<Mutation, "signTransportForm">,
      MutationSignTransportFormArgs
    >(SIGN_TRANSPORT_FORM, {
      variables: {
        id: form.id,
        input: {
          takenOverAt: takenOverAt.toISOString() as unknown as Date,
          takenOverBy: transporter.user.name
        }
      }
    });

    expect(errors).toBeUndefined();
    expect(data.signTransportForm).toEqual(
      expect.objectContaining({
        status: "RESENT",
        temporaryStorageDetail: expect.objectContaining({
          signedAt: takenOverAt.toISOString(),
          signedBy: temporaryStorage.user.name,

          takenOverAt: takenOverAt.toISOString(),
          takenOverBy: transporter.user.name
        })
      })
    );
  });

  it("should sign transport from temporary storage with security code", async () => {
    const temporaryStorage = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("ADMIN");
    const emittedAt = new Date("2018-12-11T00:00:00.000Z");
    const takenOverAt = new Date("2018-12-12T00:00:00.000Z");
    const form = await formFactory({
      ownerId: temporaryStorage.user.id,
      opt: {
        status: "SIGNED_BY_TEMP_STORER",
        recipientCompanySiret: temporaryStorage.company.siret,
        recipientCompanyName: temporaryStorage.company.name,
        temporaryStorageDetail: {
          create: {
            emittedAt: emittedAt,
            emittedBy: temporaryStorage.user.name,
            transporterCompanySiret: transporter.company.siret,
            transporterCompanyName: transporter.company.name
          }
        }
      }
    });

    const { mutate } = makeClient(temporaryStorage.user);
    const { errors, data } = await mutate<
      Pick<Mutation, "signTransportForm">,
      MutationSignTransportFormArgs
    >(SIGN_TRANSPORT_FORM, {
      variables: {
        id: form.id,
        input: {
          takenOverAt: takenOverAt.toISOString() as unknown as Date,
          takenOverBy: transporter.user.name
        },
        securityCode: transporter.company.securityCode
      }
    });

    expect(errors).toBeUndefined();
    expect(data.signTransportForm).toEqual(
      expect.objectContaining({
        status: "RESENT",
        temporaryStorageDetail: expect.objectContaining({
          signedAt: takenOverAt.toISOString(),
          signedBy: temporaryStorage.user.name,

          takenOverAt: takenOverAt.toISOString(),
          takenOverBy: transporter.user.name
        })
      })
    );
  });

  it("should throw an error if transport from temporary storage security code is invalid", async () => {
    const temporaryStorage = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("ADMIN");
    const emittedAt = new Date("2018-12-11T00:00:00.000Z");
    const takenOverAt = new Date("2018-12-12T00:00:00.000Z");
    const form = await formFactory({
      ownerId: temporaryStorage.user.id,
      opt: {
        status: "SIGNED_BY_TEMP_STORER",
        recipientCompanySiret: temporaryStorage.company.siret,
        recipientCompanyName: temporaryStorage.company.name,
        temporaryStorageDetail: {
          create: {
            emittedAt: emittedAt,
            emittedBy: temporaryStorage.user.name,
            transporterCompanySiret: transporter.company.siret,
            transporterCompanyName: transporter.company.name
          }
        }
      }
    });

    const { mutate } = makeClient(temporaryStorage.user);
    const { errors } = await mutate<
      Pick<Mutation, "signTransportForm">,
      MutationSignTransportFormArgs
    >(SIGN_TRANSPORT_FORM, {
      variables: {
        id: form.id,
        input: {
          takenOverAt: takenOverAt.toISOString() as unknown as Date,
          takenOverBy: transporter.user.name
        },
        securityCode: 9999
      }
    });

    expect(errors).not.toBeUndefined();
  });
});
