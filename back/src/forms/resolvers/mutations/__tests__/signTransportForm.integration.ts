import { EmitterType, Status } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationSignTransportFormArgs
} from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import {
  formFactory,
  toIntermediaryCompany,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import getReadableId from "../../../readableId";

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
  afterEach(resetDatabase);

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
        forwardedIn: {
          create: {
            readableId: getReadableId(),
            ownerId: temporaryStorage.user.id,
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
        forwardedIn: {
          create: {
            readableId: getReadableId(),
            ownerId: temporaryStorage.user.id,
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
        forwardedIn: {
          create: {
            readableId: getReadableId(),
            ownerId: temporaryStorage.user.id,
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

  it("should throw an error if signed by an intermediary", async () => {
    const intermediary = await userWithCompanyFactory("ADMIN");
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("ADMIN");
    const recipient = await userWithCompanyFactory("ADMIN");
    const emittedAt = new Date("2018-12-11T00:00:00.000Z");
    const takenOverAt = new Date("2018-12-12T00:00:00.000Z");
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "SIGNED_BY_PRODUCER",
        recipientCompanySiret: recipient.company.siret,
        transporterCompanySiret: transporter.company.siret,
        recipientCompanyName: recipient.company.name,
        emittedAt,
        intermediaries: {
          create: [toIntermediaryCompany(intermediary.company)]
        }
      }
    });

    const { mutate } = makeClient(intermediary.user);
    const { errors } = await mutate<
      Pick<Mutation, "signTransportForm">,
      MutationSignTransportFormArgs
    >(SIGN_TRANSPORT_FORM, {
      variables: {
        id: form.id,
        input: {
          takenOverAt: takenOverAt.toISOString() as unknown as Date,
          takenOverBy: intermediary.user.name
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous n'êtes pas autorisé à signer ce bordereau pour cet acteur"
      })
    ]);
  });

  it("should throw error is bsd is canceled", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("ADMIN");
    const takenOverAt = new Date("2018-12-12T00:00:00.000Z");
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: Status.CANCELED
      }
    });

    const { mutate } = makeClient(transporter.user);
    const { errors } = await mutate<
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

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas faire cette action, ce bordereau a été annulé"
      })
    ]);
  });

  it("should throw a validation error if transporter info is not valid", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("ADMIN");
    const takenOverAt = new Date("2018-12-12T00:00:00.000Z");
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: Status.SIGNED_BY_PRODUCER,
        transporterCompanySiret: transporter.company.siret,
        transporterCompanyAddress: null
      }
    });

    const { mutate } = makeClient(transporter.user);
    const { errors } = await mutate<
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

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Transporteur: L'adresse de l'entreprise est obligatoire"
      })
    ]);
  });

  describe("Annexe 1", () => {
    it("should forbid marking an appendix1 container as sent through signature", async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const container = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.SIGNED_BY_PRODUCER,
          emitterType: EmitterType.APPENDIX1,
          emitterCompanySiret: company.siret,
          emitterCompanyName: company.name,
          transporterCompanySiret: company.siret
        }
      });

      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "signTransportForm">,
        MutationSignTransportFormArgs
      >(SIGN_TRANSPORT_FORM, {
        variables: {
          id: container.id,
          input: {
            takenOverAt: new Date().toISOString() as unknown as Date,
            takenOverBy: "Collecteur annexe 1"
          }
        }
      });

      expect(errors.length).toBe(1);
      expect(errors[0].message).toBe(
        "Impossible de signer le transport d'un bordereau chapeau. C'est en signant les bordereaux d'annexe 1 que le statut de ce bordereau évoluera."
      );
    });

    it("should mark the appendix1 container form as sent when one of the appendix1 items is marked as sent", async () => {
      const { company: producerCompany } = await userWithCompanyFactory(
        "MEMBER"
      );
      const { user, company } = await userWithCompanyFactory("MEMBER");

      const appendix1_item = await prisma.form.create({
        data: {
          readableId: getReadableId(),
          status: Status.SIGNED_BY_PRODUCER,
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: producerCompany.siret,
          transporterCompanySiret: company.siret,
          owner: { connect: { id: user.id } }
        }
      });

      const container = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.SEALED,
          emitterType: EmitterType.APPENDIX1,
          emitterCompanySiret: company.siret,
          emitterCompanyName: company.name,
          transporterCompanySiret: company.siret,
          grouping: {
            create: { initialFormId: appendix1_item.id, quantity: 0 }
          }
        }
      });

      const { mutate } = makeClient(user);
      const { data } = await mutate<
        Pick<Mutation, "signTransportForm">,
        MutationSignTransportFormArgs
      >(SIGN_TRANSPORT_FORM, {
        variables: {
          id: appendix1_item.id,
          input: {
            takenOverAt: new Date().toISOString() as unknown as Date,
            takenOverBy: "Collecteur annexe 1"
          }
        }
      });

      expect(data.signTransportForm.status).toBe(Status.SENT);

      const appendix1Container = await prisma.form.findUniqueOrThrow({
        where: { id: container.id }
      });
      expect(appendix1Container.status).toBe(Status.SENT);
    });

    it("should allow marking an appendix1 item as sent when the container form already has sent items", async () => {
      const { company: producerCompany } = await userWithCompanyFactory(
        "MEMBER"
      );
      const { user, company } = await userWithCompanyFactory("MEMBER");

      // This first item is already SENT
      const appendix1_signed = await prisma.form.create({
        data: {
          readableId: getReadableId(),
          status: Status.SENT,
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: producerCompany.siret,
          transporterCompanySiret: company.siret,
          owner: { connect: { id: user.id } }
        }
      });
      // This second item will be signed
      const appendix1_item = await prisma.form.create({
        data: {
          readableId: getReadableId(),
          status: Status.SIGNED_BY_PRODUCER,
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: producerCompany.siret,
          transporterCompanySiret: company.siret,
          owner: { connect: { id: user.id } }
        }
      });

      // Container has the 2 items. Because first one is SENT, the container itself is SENT.
      const container = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.SENT,
          emitterType: EmitterType.APPENDIX1,
          emitterCompanySiret: company.siret,
          emitterCompanyName: company.name,
          transporterCompanySiret: company.siret,
          grouping: {
            createMany: {
              data: [
                { initialFormId: appendix1_signed.id, quantity: 0 },
                { initialFormId: appendix1_item.id, quantity: 0 }
              ]
            }
          }
        }
      });

      const { mutate } = makeClient(user);
      const { data } = await mutate<
        Pick<Mutation, "signTransportForm">,
        MutationSignTransportFormArgs
      >(SIGN_TRANSPORT_FORM, {
        variables: {
          id: appendix1_item.id,
          input: {
            takenOverAt: new Date().toISOString() as unknown as Date,
            takenOverBy: "Collecteur annexe 1"
          }
        }
      });

      expect(data.signTransportForm.status).toBe(Status.SENT);
      const appendix1Container = await prisma.form.findUniqueOrThrow({
        where: { id: container.id }
      });
      expect(appendix1Container.status).toBe(Status.SENT);
    });

    it("should disallow marking the appendix1 as sent when the container is still a draft", async () => {
      const { company: producerCompany } = await userWithCompanyFactory(
        "MEMBER"
      );
      const { user, company } = await userWithCompanyFactory("MEMBER");

      const appendix1_item = await prisma.form.create({
        data: {
          readableId: getReadableId(),
          status: Status.SIGNED_BY_PRODUCER,
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: producerCompany.siret,
          transporterCompanySiret: company.siret,
          owner: { connect: { id: user.id } }
        }
      });

      await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.DRAFT,
          emitterType: EmitterType.APPENDIX1,
          emitterCompanySiret: company.siret,
          emitterCompanyName: company.name,
          transporterCompanySiret: company.siret,
          grouping: {
            create: { initialFormId: appendix1_item.id, quantity: 0 }
          }
        }
      });

      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "signTransportForm">,
        MutationSignTransportFormArgs
      >(SIGN_TRANSPORT_FORM, {
        variables: {
          id: appendix1_item.id,
          input: {
            takenOverAt: new Date().toISOString() as unknown as Date,
            takenOverBy: "Collecteur annexe 1"
          }
        }
      });

      expect(errors.length).toBe(1);
      expect(errors[0].message).toBe(
        "Impossible de signer le transport d'un bordereau d'annexe 1 quand le bordereau chapeau est en brouillon. Veuillez d'abord sceller le bordereau chapeau."
      );
    });

    it("should allow marking an unsigned appendix1 item as sent when the transporter has automatic signature activated with the emitter", async () => {
      const { company: producerCompany } = await userWithCompanyFactory(
        "MEMBER"
      );
      const { user, company } = await userWithCompanyFactory("MEMBER");

      // Allow automatic signature
      await prisma.signatureAutomation.create({
        data: {
          fromId: producerCompany.id,
          toId: company.id
        }
      });

      const appendix1_item = await prisma.form.create({
        data: {
          readableId: getReadableId(),
          status: Status.SEALED, // Item is SEALED, not SIGNED_BY_PRODUCER
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: producerCompany.siret,
          transporterCompanySiret: company.siret,
          owner: { connect: { id: user.id } }
        }
      });

      const container = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.SEALED,
          emitterType: EmitterType.APPENDIX1,
          emitterCompanySiret: company.siret,
          emitterCompanyName: company.name,
          transporterCompanySiret: company.siret,
          grouping: {
            create: { initialFormId: appendix1_item.id, quantity: 0 }
          }
        }
      });

      const { mutate } = makeClient(user);
      const { data } = await mutate<
        Pick<Mutation, "signTransportForm">,
        MutationSignTransportFormArgs
      >(SIGN_TRANSPORT_FORM, {
        variables: {
          id: appendix1_item.id,
          input: {
            takenOverAt: new Date().toISOString() as unknown as Date,
            takenOverBy: "Collecteur annexe 1"
          }
        }
      });

      expect(data.signTransportForm.status).toBe(Status.SENT);

      const appendix1Container = await prisma.form.findUniqueOrThrow({
        where: { id: container.id }
      });
      expect(appendix1Container.status).toBe(Status.SENT);
    });

    it("should allow marking an unsigned appendix1 item as sent when there is an eco organisme", async () => {
      const { company: producerCompany } = await userWithCompanyFactory(
        "MEMBER"
      );
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const ecoOrganisme = await userWithCompanyFactory("ADMIN");

      const appendix1_item = await prisma.form.create({
        data: {
          readableId: getReadableId(),
          status: Status.SEALED, // Item is SEALED, not SIGNED_BY_PRODUCER
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: producerCompany.siret,
          transporterCompanySiret: company.siret,
          ecoOrganismeSiret: "49337909300039", // Container has an eco organisme (copied here)
          owner: { connect: { id: user.id } }
        }
      });

      const container = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.SEALED,
          emitterType: EmitterType.APPENDIX1,
          emitterCompanySiret: company.siret,
          emitterCompanyName: company.name,
          transporterCompanySiret: company.siret,
          ecoOrganismeName: ecoOrganisme.company.name,
          ecoOrganismeSiret: ecoOrganisme.company.siret, // Container has an eco organisme => no emitter signature needed
          grouping: {
            create: { initialFormId: appendix1_item.id, quantity: 0 }
          }
        }
      });

      const { mutate } = makeClient(user);
      const { data } = await mutate<
        Pick<Mutation, "signTransportForm">,
        MutationSignTransportFormArgs
      >(SIGN_TRANSPORT_FORM, {
        variables: {
          id: appendix1_item.id,
          input: {
            takenOverAt: new Date().toISOString() as unknown as Date,
            takenOverBy: "Collecteur annexe 1"
          }
        }
      });

      expect(data.signTransportForm.status).toBe(Status.SENT);

      const appendix1Container = await prisma.form.findUniqueOrThrow({
        where: { id: container.id }
      });
      expect(appendix1Container.status).toBe(Status.SENT);
    });
  });
});
