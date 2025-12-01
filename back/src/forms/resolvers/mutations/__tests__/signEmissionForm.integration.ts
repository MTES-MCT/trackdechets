import { EmitterType, Status } from "@td/prisma";
import { resetDatabase } from "../../../../../integration-tests/helper";
import type { Mutation, MutationSignEmissionFormArgs } from "@td/codegen-back";
import {
  formFactory,
  formWithTempStorageFactory,
  toIntermediaryCompany,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { SIGN_EMISSION_FORM } from "./mutations";
import { prisma } from "@td/prisma";
import { redisClient } from "../../../../common/redis";
import { securityCodeBruteForceProtection } from "../../../../common/security/bruteForceProtection";

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

  test("BSDD should be SENT after emitter signature when isDirectSupply is true", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "SEALED",
        isDirectSupply: true,
        signedByTransporter: null,
        wasteDetailsPackagingInfos: [],
        sentAt: null,
        sentBy: null,
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name
      }
    });
    await prisma.form.update({
      where: { id: form.id },
      data: { transporters: { deleteMany: {} } }
    });

    const { mutate } = makeClient(emitter.user);

    const { errors } = await mutate<
      Pick<Mutation, "signEmissionForm">,
      MutationSignEmissionFormArgs
    >(SIGN_EMISSION_FORM, {
      variables: {
        id: form.id,
        input: {
          nonRoadRegulationMention: "mention B",
          emittedAt: new Date().toISOString() as unknown as Date,
          emittedBy: emitter.user.name,
          quantity: 1
        }
      }
    });

    expect(errors).toBeUndefined();

    const signedForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });

    expect(signedForm.status).toEqual("SENT");
  });

  describe("brute force protection", () => {
    beforeEach(async () => {
      // Clean up any existing brute force data
      await redisClient.flushdb();
    });

    it("should allow valid security code on first attempt", async () => {
      const emitter = await userWithCompanyFactory("ADMIN");
      const transporter = await userWithCompanyFactory("ADMIN");
      const form = await formFactory({
        ownerId: emitter.user.id,
        opt: {
          status: "SEALED",
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
      const { errors, data } = await mutate<
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
          securityCode: emitter.company.securityCode
        }
      });

      expect(errors).toBeUndefined();
      expect(data.signEmissionForm).toBeDefined();
    });

    it("should block after multiple invalid security code attempts", async () => {
      const emitter = await userWithCompanyFactory("ADMIN");
      const transporter = await userWithCompanyFactory("ADMIN");
      const form = await formFactory({
        ownerId: emitter.user.id,
        opt: {
          status: "SEALED",
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
      const invalidSecurityCode = 9999;

      // Make 3 failed attempts (SECURITY_CODE_BRUTE_FORCE_CONFIG.maxAttempts = 3)
      for (let i = 0; i < 3; i++) {
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
            securityCode: invalidSecurityCode
          }
        });

        expect(errors).not.toBeUndefined();
        
        // Check if the error message includes remaining attempts info for the first 2 attempts
        if (i < 2) {
          const expectedRemainingAttempts = 2 - i;
          expect(errors[0].message).toContain(`${expectedRemainingAttempts} tentative(s) restante(s)`);
        } else {
          // On the 3rd attempt, should be blocked
          expect(errors[0].message).toContain("Trop de tentatives de validation du code de sécurité");
          expect(errors[0].message).toContain("bloqué pendant");
        }
      }

      // Verify that subsequent attempts with the correct security code are also blocked
      const { errors: blockedErrors } = await mutate<
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
          securityCode: emitter.company.securityCode // correct code!
        }
      });

      expect(blockedErrors).not.toBeUndefined();
      expect(blockedErrors[0].message).toContain("Trop de tentatives de validation du code de sécurité");
    });

    it("should reset attempts after successful validation", async () => {
      const emitter = await userWithCompanyFactory("ADMIN");
      const transporter = await userWithCompanyFactory("ADMIN");
      const form = await formFactory({
        ownerId: emitter.user.id,
        opt: {
          status: "SEALED",
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
      
      // Make 1 failed attempt first (leaving 2 attempts remaining)
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
          securityCode: 9999 // invalid code
        }
      });
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toContain("2 tentative(s) restante(s)");

      // Now use the correct security code - should succeed and reset attempts
      const { errors: successErrors, data } = await mutate<
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
          securityCode: emitter.company.securityCode
        }
      });

      expect(successErrors).toBeUndefined();
      expect(data.signEmissionForm).toBeDefined();

      // Verify that attempts were reset by checking the status
      const status = await securityCodeBruteForceProtection.getDetailedStatus(
        `${transporter.user.id}:${emitter.company.siret!}`, 
        "security_code_validation"
      );
      expect(status.currentAttempts).toBe(0);
    });

    it("should have different attempt counters for different companies", async () => {
      const emitter1 = await userWithCompanyFactory("ADMIN");
      const emitter2 = await userWithCompanyFactory("ADMIN");
      const transporter = await userWithCompanyFactory("ADMIN");
      
      const form1 = await formFactory({
        ownerId: emitter1.user.id,
        opt: {
          status: "SEALED",
          emitterCompanySiret: emitter1.company.siret,
          emitterCompanyName: emitter1.company.name,
          transporters: {
            create: {
              transporterCompanySiret: transporter.company.siret,
              transporterCompanyName: transporter.company.name,
              number: 1
            }
          }
        }
      });

      const form2 = await formFactory({
        ownerId: emitter2.user.id,
        opt: {
          status: "SEALED",
          emitterCompanySiret: emitter2.company.siret,
          emitterCompanyName: emitter2.company.name,
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

      // Make 3 failed attempts for emitter1 (should get blocked)
      for (let i = 0; i < 3; i++) {
        await mutate<Pick<Mutation, "signEmissionForm">, MutationSignEmissionFormArgs>(
          SIGN_EMISSION_FORM,
          {
            variables: {
              id: form1.id,
              input: {
                emittedAt: "2018-12-11T00:00:00.000Z" as unknown as Date,
                emittedBy: emitter1.user.name,
                quantity: 1
              },
              securityCode: 9999
            }
          }
        );
      }

      // Emitter1 should be blocked for this user
      const status1 = await securityCodeBruteForceProtection.isBlocked(
        `${transporter.user.id}:${emitter1.company.siret!}`,
        "security_code_validation"
      );
      expect(status1.isBlocked).toBe(true);

      // But emitter2 should still work fine for the same user
      const { errors, data } = await mutate<
        Pick<Mutation, "signEmissionForm">,
        MutationSignEmissionFormArgs
      >(SIGN_EMISSION_FORM, {
        variables: {
          id: form2.id,
          input: {
            emittedAt: "2018-12-11T00:00:00.000Z" as unknown as Date,
            emittedBy: emitter2.user.name,
            quantity: 1
          },
          securityCode: emitter2.company.securityCode
        }
      });

      expect(errors).toBeUndefined();
      expect(data.signEmissionForm).toBeDefined();
    });

    it("should have different attempt counters for different users trying same company", async () => {
      const emitter = await userWithCompanyFactory("ADMIN");
      const transporter1 = await userWithCompanyFactory("ADMIN");
      const transporter2 = await userWithCompanyFactory("ADMIN");
      
      const form = await formFactory({
        ownerId: emitter.user.id,
        opt: {
          status: "SEALED",
          emitterCompanySiret: emitter.company.siret,
          emitterCompanyName: emitter.company.name,
          transporters: {
            create: {
              transporterCompanySiret: transporter1.company.siret,
              transporterCompanyName: transporter1.company.name,
              number: 1
            }
          }
        }
      });

      // Transporter1 makes 3 failed attempts (gets blocked)
      const mutate1 = makeClient(transporter1.user).mutate;
      for (let i = 0; i < 3; i++) {
        await mutate1<Pick<Mutation, "signEmissionForm">, MutationSignEmissionFormArgs>(
          SIGN_EMISSION_FORM,
          {
            variables: {
              id: form.id,
              input: {
                emittedAt: "2018-12-11T00:00:00.000Z" as unknown as Date,
                emittedBy: emitter.user.name,
                quantity: 1
              },
              securityCode: 9999
            }
          }
        );
      }

      // Transporter1 should be blocked
      const status1 = await securityCodeBruteForceProtection.isBlocked(
        `${transporter1.user.id}:${emitter.company.siret!}`,
        "security_code_validation"
      );
      expect(status1.isBlocked).toBe(true);

      // But transporter2 should still be able to use the correct security code for the same company
      const mutate2 = makeClient(transporter2.user).mutate;
      const { errors, data } = await mutate2<
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
          securityCode: emitter.company.securityCode
        }
      });

      expect(errors).toBeUndefined();
      expect(data.signEmissionForm).toBeDefined();
    });

    it("should not reveal if security code is correct during rate limiting", async () => {
      const emitter = await userWithCompanyFactory("ADMIN");
      const transporter = await userWithCompanyFactory("ADMIN");
      const form = await formFactory({
        ownerId: emitter.user.id,
        opt: {
          status: "SEALED",
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

      // Make 2 failed attempts to get close to lockout (1 attempt remaining)
      for (let i = 0; i < 2; i++) {
        await mutate<Pick<Mutation, "signEmissionForm">, MutationSignEmissionFormArgs>(
          SIGN_EMISSION_FORM,
          {
            variables: {
              id: form.id,
              input: {
                emittedAt: "2018-12-11T00:00:00.000Z" as unknown as Date,
                emittedBy: emitter.user.name,
                quantity: 1
              },
              securityCode: 9999 // invalid code
            }
          }
        );
      }

      // Now try with the CORRECT security code - should still be blocked
      // This is the security feature: during rate limiting, even correct codes are blocked
      // to prevent attackers from learning whether their guess was right
      const { errors: correctCodeErrors } = await mutate<
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
          securityCode: emitter.company.securityCode // CORRECT code!
        }
      });

      // Even with correct code, user should get rate limited error
      expect(correctCodeErrors).not.toBeUndefined();
      expect(correctCodeErrors[0].message).toContain("Trop de tentatives de validation du code de sécurité");
      expect(correctCodeErrors[0].message).toContain("bloqué pendant");
      
      // Verify the attacker cannot distinguish between correct and incorrect codes
      const { errors: incorrectCodeErrors } = await mutate<
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
          securityCode: 8888 // INCORRECT code
        }
      });

      // Should get the same error message regardless of whether code is correct
      expect(incorrectCodeErrors).not.toBeUndefined();
      expect(incorrectCodeErrors[0].message).toEqual(correctCodeErrors[0].message);
    });
  });
});
