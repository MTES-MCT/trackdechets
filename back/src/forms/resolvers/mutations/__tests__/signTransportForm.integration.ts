import { EmitterType, Status } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationSignTransportFormArgs
} from "../../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import {
  bsddTransporterFactory,
  formFactory,
  formWithTempStorageFactory,
  toIntermediaryCompany,
  transporterReceiptFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { getTransportersSync } from "../../../database";

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

  it("should sign transport for first transporter", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("ADMIN");
    await transporterReceiptFactory({ company: transporter.company });
    const emittedAt = new Date("2018-12-11T00:00:00.000Z");
    const takenOverAt = new Date("2018-12-12T00:00:00.000Z");
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name,
        signedByTransporter: null,
        sentAt: null,
        sentBy: null,
        emittedAt: emittedAt,
        emittedBy: emitter.user.name,
        transporters: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            transporterCompanyName: transporter.company.name,
            number: 1
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
        status: "SENT",

        signedByTransporter: true,
        sentAt: takenOverAt.toISOString(),
        sentBy: emitter.user.name,

        takenOverAt: takenOverAt.toISOString(),
        takenOverBy: transporter.user.name
      })
    );
  });

  it("should sign transport for transporter N", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter1 = await userWithCompanyFactory("ADMIN");
    const transporter2 = await userWithCompanyFactory("ADMIN");
    await transporterReceiptFactory({ company: transporter1.company });
    await transporterReceiptFactory({ company: transporter2.company });

    const emittedAt = new Date("2018-12-11T00:00:00.000Z");
    const takenOverAt = new Date("2018-12-12T00:00:00.000Z");
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "SENT",
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name,
        signedByTransporter: null,
        sentAt: emittedAt,
        sentBy: emitter.user.name,
        takenOverAt,
        takenOverBy: transporter1.user.name,
        emittedAt: emittedAt,
        emittedBy: emitter.user.name,
        transporters: {
          create: {
            transporterCompanySiret: transporter1.company.siret,
            takenOverAt: new Date("2018-12-12T00:00:00.000Z"),
            takenOverBy: transporter1.user.name,
            number: 1
          }
        }
      }
    });

    const bsddTransporter2 = await bsddTransporterFactory({
      formId: form.id,
      opts: {
        transporterCompanySiret: transporter2.company.siret
      }
    });

    const { mutate } = makeClient(transporter2.user);
    const { errors } = await mutate<
      Pick<Mutation, "signTransportForm">,
      MutationSignTransportFormArgs
    >(SIGN_TRANSPORT_FORM, {
      variables: {
        id: form.id,
        input: {
          takenOverAt: takenOverAt.toISOString() as any,
          takenOverBy: transporter2.user.name
        }
      }
    });

    expect(errors).toBeUndefined();

    const updatedForm = await prisma.form.findFirstOrThrow({
      where: { id: form.id },
      include: { transporters: true }
    });

    const transporters = getTransportersSync(updatedForm);

    expect(transporters[1].id).toEqual(bsddTransporter2.id);
    expect(transporters[1].takenOverAt).toEqual(takenOverAt);
    expect(transporters[1].takenOverBy).toEqual(transporter2.user.name);

    expect(updatedForm.currentTransporterOrgId).toEqual(
      transporter2.company.siret
    );
  });

  it("should not be possible for transporter N+1 to sign if transporter N has not signed", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter1 = await userWithCompanyFactory("ADMIN");
    const transporter2 = await userWithCompanyFactory("ADMIN");
    await transporterReceiptFactory({ company: transporter1.company });
    await transporterReceiptFactory({ company: transporter2.company });

    const emittedAt = new Date("2018-12-11T00:00:00.000Z");
    const takenOverAt = new Date("2018-12-12T00:00:00.000Z");
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "SENT",
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name,
        signedByTransporter: null,
        sentAt: emittedAt,
        sentBy: emitter.user.name,
        takenOverAt,
        takenOverBy: transporter1.user.name,
        emittedAt: emittedAt,
        emittedBy: emitter.user.name,
        transporters: {
          create: {
            transporterCompanySiret: transporter1.company.siret,
            takenOverAt: null, // transporter n°1 has not signed yet
            takenOverBy: null,
            number: 1
          }
        }
      }
    });

    await bsddTransporterFactory({
      formId: form.id,
      opts: {
        transporterCompanySiret: transporter2.company.siret
      }
    });

    const { mutate } = makeClient(transporter2.user);
    const { errors } = await mutate<
      Pick<Mutation, "signTransportForm">,
      MutationSignTransportFormArgs
    >(SIGN_TRANSPORT_FORM, {
      variables: {
        id: form.id,
        input: {
          takenOverAt: takenOverAt.toISOString() as any,
          takenOverBy: transporter2.user.name
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

  it("should sign transport with receipt exemption", async () => {
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
        signedByTransporter: null,
        sentAt: null,
        sentBy: null,
        emittedAt: emittedAt,
        emittedBy: emitter.user.name,
        transporters: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            transporterCompanyName: transporter.company.name,
            transporterIsExemptedOfReceipt: true,
            number: 1
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
    await transporterReceiptFactory({ company: transporter.company });
    const emittedAt = new Date("2018-12-11T00:00:00.000Z");
    const takenOverAt = new Date("2018-12-12T00:00:00.000Z");
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name,
        signedByTransporter: null,
        sentAt: null,
        sentBy: null,
        emittedAt: emittedAt,
        emittedBy: emitter.user.name,
        transporters: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            transporterCompanyName: transporter.company.name,
            number: 1
          }
        }
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
        signedByTransporter: null,
        sentAt: null,
        sentBy: null,
        emittedAt: emittedAt,
        emittedBy: emitter.user.name,
        transporters: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            transporterCompanyName: transporter.company.name,
            number: 1
          }
        }
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

    const form = await formWithTempStorageFactory({
      ownerId: temporaryStorage.user.id,
      opt: {
        status: "SIGNED_BY_TEMP_STORER",
        recipientCompanySiret: temporaryStorage.company.siret,
        recipientCompanyName: temporaryStorage.company.name
      },
      forwardedInOpts: {
        emittedAt: emittedAt,
        emittedBy: temporaryStorage.user.name,
        transporters: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            transporterCompanyName: transporter.company.name,
            number: 1
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

    const form = await formWithTempStorageFactory({
      ownerId: temporaryStorage.user.id,
      opt: {
        status: "SIGNED_BY_TEMP_STORER",
        recipientCompanySiret: temporaryStorage.company.siret,
        recipientCompanyName: temporaryStorage.company.name
      },
      forwardedInOpts: {
        emittedAt: emittedAt,
        emittedBy: temporaryStorage.user.name,
        transporters: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            transporterCompanyName: transporter.company.name,
            number: 1
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

    const form = await formWithTempStorageFactory({
      ownerId: temporaryStorage.user.id,
      opt: {
        status: "SIGNED_BY_TEMP_STORER",
        recipientCompanySiret: temporaryStorage.company.siret,
        recipientCompanyName: temporaryStorage.company.name
      },
      forwardedInOpts: {
        emittedAt: emittedAt,
        emittedBy: temporaryStorage.user.name,
        transporters: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            transporterCompanyName: transporter.company.name,
            number: 1
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
        recipientCompanyName: recipient.company.name,
        emittedAt,
        intermediaries: {
          create: [toIntermediaryCompany(intermediary.company)]
        },
        transporters: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            number: 1
          }
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
        transporters: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            transporterCompanyAddress: null,
            number: 1
          }
        }
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
        message: expect.stringContaining(
          "Transporteur: L'adresse de l'entreprise est obligatoire"
        )
      })
    ]);
    expect(errors).toEqual([
      expect.objectContaining({
        message: expect.stringContaining(
          "Transporteur: le département associé au récépissé est obligatoire - l'établissement doit renseigner son récépissé dans Trackdéchets"
        )
      })
    ]);
    expect(errors).toEqual([
      expect.objectContaining({
        message: expect.stringContaining(
          "Transporteur: la date limite de validité du récépissé est obligatoire - l'établissement doit renseigner son récépissé dans Trackdéchets"
        )
      })
    ]);
    expect(errors).toEqual([
      expect.objectContaining({
        message: expect.stringContaining(
          "Transporteur: le numéro de récépissé est obligatoire - l'établissement doit renseigner son récépissé dans Trackdéchets"
        )
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
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1
            }
          }
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
      await transporterReceiptFactory({ company });
      const appendix1Item = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.SIGNED_BY_PRODUCER,
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: producerCompany.siret,
          emitterCompanyName: company.name,
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1
            }
          }
        }
      });

      await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.SENT,
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: producerCompany.siret,
          emitterCompanyName: company.name,
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1
            }
          }
        }
      });

      const container = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.SEALED,
          emitterType: EmitterType.APPENDIX1,
          emitterCompanySiret: company.siret,
          emitterCompanyName: company.name,
          grouping: {
            create: { initialFormId: appendix1Item.id, quantity: 0 }
          },
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1
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
          id: appendix1Item.id,
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
      await transporterReceiptFactory({ company });
      // This first item is already SENT
      const appendix1_signed = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.SENT,
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: producerCompany.siret,
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1
            }
          }
        }
      });

      // This second item will be signed
      const appendix1Item = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.SIGNED_BY_PRODUCER,
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: producerCompany.siret,
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1
            }
          }
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
          grouping: {
            createMany: {
              data: [
                { initialFormId: appendix1_signed.id, quantity: 0 },
                { initialFormId: appendix1Item.id, quantity: 0 }
              ]
            }
          },
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1
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
          id: appendix1Item.id,
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
      await transporterReceiptFactory({ company });
      const appendix1Item = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.SIGNED_BY_PRODUCER,
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: producerCompany.siret,
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1
            }
          }
        }
      });

      await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.DRAFT,
          emitterType: EmitterType.APPENDIX1,
          emitterCompanySiret: company.siret,
          emitterCompanyName: company.name,
          grouping: {
            create: { initialFormId: appendix1Item.id, quantity: 0 }
          },
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1
            }
          }
        }
      });

      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "signTransportForm">,
        MutationSignTransportFormArgs
      >(SIGN_TRANSPORT_FORM, {
        variables: {
          id: appendix1Item.id,
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
      await transporterReceiptFactory({ company });
      // Allow automatic signature
      await prisma.signatureAutomation.create({
        data: {
          fromId: producerCompany.id,
          toId: company.id
        }
      });

      const appendix1Item = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.SEALED, // Item is SEALED, not SIGNED_BY_PRODUCER
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: producerCompany.siret,
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1
            }
          }
        }
      });

      const container = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.SEALED,
          emitterType: EmitterType.APPENDIX1,
          emitterCompanySiret: company.siret,
          emitterCompanyName: company.name,
          grouping: {
            create: { initialFormId: appendix1Item.id, quantity: 0 }
          },
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1
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
          id: appendix1Item.id,
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
      await transporterReceiptFactory({ company });
      const ecoOrganisme = await userWithCompanyFactory("ADMIN");

      const appendix1Item = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.SEALED, // Item is SEALED, not SIGNED_BY_PRODUCER
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: producerCompany.siret,
          ecoOrganismeSiret: "49337909300039", // Container has an eco organisme (copied here)
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1
            }
          }
        }
      });

      const container = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.SEALED,
          emitterType: EmitterType.APPENDIX1,
          emitterCompanySiret: company.siret,
          emitterCompanyName: company.name,
          ecoOrganismeName: ecoOrganisme.company.name,
          ecoOrganismeSiret: ecoOrganisme.company.siret, // Container has an eco organisme => no emitter signature needed
          grouping: {
            create: { initialFormId: appendix1Item.id, quantity: 0 }
          },
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1
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
          id: appendix1Item.id,
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

    it("should update all forms with plate number", async () => {
      const { company: producerCompany } = await userWithCompanyFactory(
        "MEMBER"
      );
      const { user, company } = await userWithCompanyFactory("MEMBER");
      await transporterReceiptFactory({ company });
      const appendix1Item = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.SIGNED_BY_PRODUCER,
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: producerCompany.siret,
          emitterCompanyName: company.name,
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1,
              transporterNumberPlate: ""
            }
          }
        }
      });

      const appendix2Item = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.SIGNED_BY_PRODUCER,
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: producerCompany.siret,
          emitterCompanyName: company.name,
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1,
              transporterNumberPlate: ""
            }
          }
        }
      });

      const parent = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.SEALED,
          emitterType: EmitterType.APPENDIX1,
          emitterCompanySiret: company.siret,
          emitterCompanyName: company.name,
          grouping: {
            createMany: {
              data: [
                { initialFormId: appendix1Item.id, quantity: 10 },
                { initialFormId: appendix2Item.id, quantity: 10 }
              ]
            }
          },
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1
            }
          }
        }
      });

      const { mutate } = makeClient(user);
      const { data: updatedAppendix1Item } = await mutate<
        Pick<Mutation, "signTransportForm">,
        MutationSignTransportFormArgs
      >(SIGN_TRANSPORT_FORM, {
        variables: {
          id: appendix1Item.id,
          input: {
            takenOverAt: new Date().toISOString() as unknown as Date,
            takenOverBy: "Collecteur annexe 1",
            transporterNumberPlate: "TRANSPORTER-PLATE"
          }
        }
      });

      expect(updatedAppendix1Item.signTransportForm.status).toBe(Status.SENT);

      // Should save plate
      const appendix1ItemTransporters = await prisma.bsddTransporter.findFirst({
        where: { formId: appendix1Item.id }
      });
      expect(appendix1ItemTransporters?.transporterNumberPlate).toBe(
        "TRANSPORTER-PLATE"
      );

      // Should copy plate to next items
      const appendix2ItemTransporters = await prisma.bsddTransporter.findFirst({
        where: { formId: appendix2Item.id }
      });
      expect(appendix2ItemTransporters?.transporterNumberPlate).toBe(
        "TRANSPORTER-PLATE"
      );

      // Parent should have its plate updated as well
      const parentTransporters = await prisma.bsddTransporter.findFirst({
        where: { formId: parent.id }
      });
      expect(parentTransporters?.transporterNumberPlate).toBe(
        "TRANSPORTER-PLATE"
      );

      // SECOND UPDATE (on the second child bsd)

      await mutate<
        Pick<Mutation, "signTransportForm">,
        MutationSignTransportFormArgs
      >(SIGN_TRANSPORT_FORM, {
        variables: {
          id: appendix2Item.id,
          input: {
            takenOverAt: new Date().toISOString() as unknown as Date,
            takenOverBy: "Collecteur annexe 1",
            transporterNumberPlate: "TRANSPORTER-PLATE-2"
          }
        }
      });

      // Should override plate
      const appendix2ItemTransportersBis =
        await prisma.bsddTransporter.findFirst({
          where: { formId: appendix2Item.id }
        });
      expect(appendix2ItemTransportersBis?.transporterNumberPlate).toBe(
        "TRANSPORTER-PLATE-2"
      );

      // Should override plate from child bsd 1
      const appendix1ItemTransportersBis =
        await prisma.bsddTransporter.findFirst({
          where: { formId: appendix1Item.id }
        });
      expect(appendix1ItemTransportersBis?.transporterNumberPlate).toBe(
        "TRANSPORTER-PLATE-2"
      );

      // Parent should have its plate updated as well
      const parentTransportersBis = await prisma.bsddTransporter.findFirst({
        where: { formId: parent.id }
      });
      expect(parentTransportersBis?.transporterNumberPlate).toBe(
        "TRANSPORTER-PLATE-2"
      );
    });
  });
});
