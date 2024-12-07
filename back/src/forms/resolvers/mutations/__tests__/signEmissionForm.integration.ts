import { EmitterType, Status } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { Mutation, MutationSignEmissionFormArgs } from "@td/codegen-back";
import {
  formFactory,
  formWithTempStorageFactory,
  toIntermediaryCompany,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { SIGN_EMISSION_FORM } from "./mutations";

describe("signEmissionForm", () => {
  afterEach(resetDatabase);

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

  it("should throw an error if the form is signed by an intermdediary", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const intermediary = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name,
        intermediaries: {
          create: [toIntermediaryCompany(intermediary.company)]
        }
      }
    });

    const { mutate } = makeClient(intermediary.user);
    const { errors } = await mutate<
      Pick<Mutation, "signEmissionForm">,
      MutationSignEmissionFormArgs
    >(SIGN_EMISSION_FORM, {
      variables: {
        id: form.id,
        input: {
          emittedAt: "2018-12-11T00:00:00.000Z" as unknown as Date,
          emittedBy: intermediary.user.name,
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
        transporters: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            transporterCompanyName: transporter.company.name,
            number: 1
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
        ecoOrganismeSiret: ecoOrganisme.company.siret,
        ecoOrganismeName: ecoOrganisme.company.name,
        transporters: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            transporterCompanyName: transporter.company.name,
            number: 1
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
        ecoOrganismeSiret: ecoOrganisme.company.siret,
        ecoOrganismeName: ecoOrganisme.company.name,
        transporters: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            transporterCompanyName: transporter.company.name,
            number: 1
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

    const form = await formWithTempStorageFactory({
      ownerId: temporaryStorage.user.id,
      opt: {
        status: "RESEALED",
        recipientCompanySiret: temporaryStorage.company.siret,
        recipientCompanyName: temporaryStorage.company.name
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
          signedBy: temporaryStorage.user.name,
          emittedAt: emittedAt.toISOString(),
          emittedBy: temporaryStorage.user.name
        })
      })
    );
  });

  it(
    "should not be possible to sign emission for the temporary storage and " +
      "specify a weight > 40 T when transport mode is ROAD",
    async () => {
      const temporaryStorage = await userWithCompanyFactory("ADMIN");

      const form = await formWithTempStorageFactory({
        ownerId: temporaryStorage.user.id,
        opt: {
          status: "RESEALED",
          recipientCompanySiret: temporaryStorage.company.siret,
          recipientCompanyName: temporaryStorage.company.name
        },
        forwardedInOpts: {
          transporters: {
            create: {
              transporterTransportMode: "ROAD",
              number: 1
            }
          }
        }
      });

      const emittedAt = new Date("2018-12-11T00:00:00.000Z");

      const { mutate } = makeClient(temporaryStorage.user);
      const { errors } = await mutate<
        Pick<Mutation, "signEmissionForm">,
        MutationSignEmissionFormArgs
      >(SIGN_EMISSION_FORM, {
        variables: {
          id: form.id,
          input: {
            emittedAt: emittedAt.toISOString() as unknown as Date,
            emittedBy: temporaryStorage.user.name,
            quantity: 50
          }
        }
      });

      expect(errors).toBeDefined();
      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Déchet : le poids doit être inférieur à 40 tonnes lorsque le transport se fait par la route"
        })
      ]);
    }
  );

  it("should sign emission via temporary storage's security code", async () => {
    const temporaryStorage = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("ADMIN");

    const form = await formWithTempStorageFactory({
      ownerId: temporaryStorage.user.id,
      opt: {
        status: "RESEALED",
        recipientCompanySiret: temporaryStorage.company.siret,
        recipientCompanyName: temporaryStorage.company.name
      },
      forwardedInOpts: {
        transporters: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            transporterCompanyName: transporter.company.name,
            number: 1
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
          signedBy: temporaryStorage.user.name,
          emittedAt: emittedAt.toISOString(),
          emittedBy: temporaryStorage.user.name
        })
      })
    );
  });

  it("should throw an error if temporary storage's security code is invalid", async () => {
    const temporaryStorage = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("ADMIN");

    const form = await formWithTempStorageFactory({
      ownerId: temporaryStorage.user.id,
      opt: {
        status: "RESEALED",
        recipientCompanySiret: temporaryStorage.company.siret,
        recipientCompanyName: temporaryStorage.company.name
      },
      forwardedInOpts: {
        transporters: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            transporterCompanyName: transporter.company.name,
            number: 1
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

  it("should throw error if bsd is canceled", async () => {
    const temporaryStorage = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: temporaryStorage.user.id,
      opt: {
        status: Status.CANCELED
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
        securityCode: temporaryStorage.company.securityCode
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas faire cette action, ce bordereau a été annulé"
      })
    ]);
  });

  it("should forbid marking an appendix1 container as sent through signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const container = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.SEALED,
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
      Pick<Mutation, "signEmissionForm">,
      MutationSignEmissionFormArgs
    >(SIGN_EMISSION_FORM, {
      variables: {
        id: container.id,
        input: {
          emittedAt: new Date().toISOString() as unknown as Date,
          emittedBy: "Collecteur annexe 1",
          quantity: 1
        }
      }
    });

    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe(
      "Impossible de signer le transport d'un bordereau chapeau. C'est en signant les bordereaux d'annexe 1 que le statut de ce bordereau évoluera."
    );
  });

  it("should throw an error if packaging is empty", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "SEALED",
        wasteDetailsPackagingInfos: [],
        signedByTransporter: null,
        sentAt: null,
        sentBy: null,
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name,
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
    expect(errors[0].message).toBe(
      "Le nombre de contenants doit être supérieur à 0"
    );
  });

  it("can still modify nonRoadRegulationMention", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "SEALED",
        signedByTransporter: null,
        sentAt: null,
        sentBy: null,
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name,
        wasteDetailsNonRoadRegulationMention: "mention A"
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
          nonRoadRegulationMention: "mention B",
          emittedAt: emittedAt.toISOString() as unknown as Date,
          emittedBy: emitter.user.name,
          quantity: 1
        }
      }
    });

    expect(errors).toBeUndefined();
    expect(
      data.signEmissionForm.wasteDetails?.nonRoadRegulationMention
    ).toEqual("mention B");
  });
});
