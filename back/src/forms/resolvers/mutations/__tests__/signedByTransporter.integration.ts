import { format } from "date-fns";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { ErrorCode } from "../../../../common/errors";
import {
  companyFactory,
  formFactory,
  formWithTempStorageFactory,
  toIntermediaryCompany,
  transporterReceiptFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { allowedFormats } from "../../../../common/dates";
import { Status, UserRole } from "@prisma/client";
import { Mutation } from "../../../../generated/graphql/types";

jest.mock("axios", () => ({
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} }))
  }
}));

const SIGNED_BY_TRANSPORTER = `mutation SignedByTransporter($id: ID!, $signingInfo: TransporterSignatureFormInput!) {
  signedByTransporter(id: $id, signingInfo: $signingInfo) {
    id
    status
  }
}`;

describe("Mutation.signedByTransporter", () => {
  afterEach(() => resetDatabase());

  it("should mark a form as signed with deprecated packagings field", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    await transporterReceiptFactory({ company });

    const emitterCompany = await companyFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        sentAt: null,
        status: "SEALED",
        emitterCompanyName: emitterCompany.name,
        emitterCompanySiret: emitterCompany.siret,
        transporters: {
          create: {
            transporterCompanyName: company.name,
            transporterCompanySiret: company.siret,
            number: 1
          }
        }
      }
    });

    const { mutate } = makeClient(user);
    await mutate<Pick<Mutation, "signedByTransporter">>(SIGNED_BY_TRANSPORTER, {
      variables: {
        id: form.id,
        signingInfo: {
          sentAt: "2018-12-11T00:00:00.000Z",
          signedByTransporter: true,
          securityCode: emitterCompany.securityCode,
          sentBy: "Roger Lapince",
          signedByProducer: true,
          packagings: (
            form.wasteDetailsPackagingInfos as {
              type: string;
            }[]
          ).map(p => p.type),
          quantity: form.wasteDetailsQuantity,
          onuCode: "Code ONU"
        }
      }
    });

    const resultingForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });
    expect(resultingForm.status).toBe("SENT");
  });

  it("should mark a form as signed", async () => {
    const transporter = await userWithCompanyFactory("ADMIN");
    await transporterReceiptFactory({ company: transporter.company });
    const emitter = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: transporter.user.id,
      opt: {
        sentAt: null,
        status: "SEALED",
        emitterCompanyName: emitter.company.name,
        emitterCompanySiret: emitter.company.siret,
        transporters: {
          create: {
            transporterCompanyName: transporter.company.name,
            transporterCompanySiret: transporter.company.siret,
            number: 1
          }
        }
      }
    });
    const sentAt = new Date("2018-12-11T00:00:00.000Z");

    const { mutate } = makeClient(transporter.user);
    await mutate<Pick<Mutation, "signedByTransporter">>(SIGNED_BY_TRANSPORTER, {
      variables: {
        id: form.id,
        signingInfo: {
          sentAt: sentAt.toISOString(),
          signedByTransporter: true,
          securityCode: emitter.company.securityCode,
          sentBy: emitter.user.name,
          signedByProducer: true,
          packagingInfos: form.wasteDetailsPackagingInfos,
          quantity: form.wasteDetailsQuantity,
          onuCode: "Code ONU"
        }
      }
    });

    const resultingForm = await prisma.form.findUnique({
      where: { id: form.id }
    });
    expect(resultingForm).toEqual(
      expect.objectContaining({
        status: "SENT",
        signedByTransporter: true,
        sentAt: sentAt,
        sentBy: emitter.user.name,

        emittedAt: sentAt,
        emittedBy: emitter.user.name,
        emittedByEcoOrganisme: false,
        takenOverAt: sentAt,
        takenOverBy: transporter.user.name
      })
    );
  });

  it("should mark a form as signed with transporter receipt exemption", async () => {
    const transporter = await userWithCompanyFactory("ADMIN");
    const emitter = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: transporter.user.id,
      opt: {
        sentAt: null,
        status: "SEALED",
        emitterCompanyName: emitter.company.name,
        emitterCompanySiret: emitter.company.siret,
        transporters: {
          create: {
            transporterCompanyName: transporter.company.name,
            transporterCompanySiret: transporter.company.siret,
            transporterIsExemptedOfReceipt: true,
            number: 1
          }
        }
      }
    });
    const sentAt = new Date("2018-12-11T00:00:00.000Z");

    const { mutate } = makeClient(transporter.user);
    await mutate<Pick<Mutation, "signedByTransporter">>(SIGNED_BY_TRANSPORTER, {
      variables: {
        id: form.id,
        signingInfo: {
          sentAt: sentAt.toISOString(),
          signedByTransporter: true,
          securityCode: emitter.company.securityCode,
          sentBy: emitter.user.name,
          signedByProducer: true,
          packagingInfos: form.wasteDetailsPackagingInfos,
          quantity: form.wasteDetailsQuantity,
          onuCode: "Code ONU"
        }
      }
    });

    const resultingForm = await prisma.form.findUnique({
      where: { id: form.id }
    });
    expect(resultingForm).toEqual(
      expect.objectContaining({
        status: "SENT",
        signedByTransporter: true,
        sentAt: sentAt,
        sentBy: emitter.user.name,

        emittedAt: sentAt,
        emittedBy: emitter.user.name,
        emittedByEcoOrganisme: false,
        takenOverAt: sentAt,
        takenOverBy: transporter.user.name
      })
    );
  });

  it("should return an error if onuCode is provided empty for a dangerous waste", async () => {
    const { user, company: transporter } = await userWithCompanyFactory(
      "ADMIN"
    );
    await transporterReceiptFactory({ company: transporter });

    const emitter = await companyFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        sentAt: null,
        status: "SEALED",
        wasteDetailsCode: "01 03 04*",
        emitterCompanySiret: emitter.siret,
        transporters: {
          create: {
            transporterCompanySiret: transporter.siret,
            number: 1
          }
        }
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "signedByTransporter">>(
      SIGNED_BY_TRANSPORTER,
      {
        variables: {
          id: form.id,
          signingInfo: {
            sentAt: "2018-12-11T00:00:00.000Z",
            signedByTransporter: true,
            securityCode: emitter.securityCode,
            sentBy: "Roger Lapince",
            signedByProducer: true,
            packagingInfos: form.wasteDetailsPackagingInfos,
            quantity: form.wasteDetailsQuantity,
            onuCode: ""
          }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: `La mention ADR est obligatoire pour les déchets dangereux. Merci d'indiquer "non soumis" si nécessaire.`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should return an error if transporter receipt is missing", async () => {
    const { user, company: transporter } = await userWithCompanyFactory(
      "ADMIN"
    );
    const emitter = await companyFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        sentAt: null,
        status: "SEALED",
        wasteDetailsCode: "01 03 04*",
        emitterCompanySiret: emitter.siret,
        transporters: {
          create: {
            transporterCompanySiret: transporter.siret,
            number: 1
          }
        }
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "signedByTransporter">>(
      SIGNED_BY_TRANSPORTER,
      {
        variables: {
          id: form.id,
          signingInfo: {
            sentAt: "2018-12-11T00:00:00.000Z",
            signedByTransporter: true,
            securityCode: emitter.securityCode,
            sentBy: "Roger Lapince",
            signedByProducer: true,
            packagingInfos: form.wasteDetailsPackagingInfos,
            quantity: form.wasteDetailsQuantity,
            onuCode: ""
          }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: expect.stringContaining(
          "Transporteur: le numéro de récépissé est obligatoire - l'établissement doit renseigner son récépissé dans Trackdéchets"
        ),
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should not return an error if onuCode is provided empty for a non-dangerous waste", async () => {
    const { user, company: transporter } = await userWithCompanyFactory(
      "ADMIN"
    );
    await transporterReceiptFactory({ company: transporter });

    const emitter = await companyFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        sentAt: null,
        status: "SEALED",
        wasteDetailsCode: "01 01 01",
        wasteDetailsIsDangerous: false,
        emitterCompanySiret: emitter.siret,
        transporters: {
          create: {
            transporterCompanySiret: transporter.siret,
            number: 1
          }
        }
      }
    });

    const { mutate } = makeClient(user);
    const { data, errors } = await mutate<
      Pick<Mutation, "signedByTransporter">
    >(SIGNED_BY_TRANSPORTER, {
      variables: {
        id: form.id,
        signingInfo: {
          sentAt: "2018-12-11T00:00:00.000Z",
          signedByTransporter: true,
          securityCode: emitter.securityCode,
          sentBy: "Roger Lapince",
          signedByProducer: true,
          packagingInfos: form.wasteDetailsPackagingInfos,
          quantity: form.wasteDetailsQuantity,
          onuCode: ""
        }
      }
    });

    expect(errors).toBe(undefined);
    expect(data.signedByTransporter.status).toBe("SENT");
  });

  it("should fail if wrong security code", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    await transporterReceiptFactory({ company });

    const emitterCompany = await companyFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        sentAt: null,
        status: "SEALED",
        emitterCompanyName: emitterCompany.name,
        emitterCompanySiret: emitterCompany.siret,
        transporters: {
          create: {
            transporterCompanyName: company.name,
            transporterCompanySiret: company.siret,
            number: 1
          }
        }
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "signedByTransporter">>(
      SIGNED_BY_TRANSPORTER,
      {
        variables: {
          id: form.id,
          signingInfo: {
            sentAt: "2018-12-11T00:00:00.000Z",
            signedByTransporter: true,
            securityCode: 4567,
            sentBy: "Roger Lapince",
            signedByProducer: true,
            packagingInfos: form.wasteDetailsPackagingInfos,
            quantity: form.wasteDetailsQuantity
          }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le code de signature est invalide.",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should fail when not signed by producer", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const emitterCompany = await companyFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        sentAt: null,
        status: "SEALED",
        emitterCompanyName: emitterCompany.name,
        emitterCompanySiret: emitterCompany.siret,
        transporters: {
          create: {
            transporterCompanyName: company.name,
            transporterCompanySiret: company.siret,
            number: 1
          }
        }
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "signedByTransporter">>(
      SIGNED_BY_TRANSPORTER,
      {
        variables: {
          id: form.id,
          signingInfo: {
            sentAt: "2018-12-11T00:00:00.000Z",
            signedByTransporter: true,
            securityCode: 1234,
            sentBy: "Roger Lapince",
            signedByProducer: false,
            packagingInfos: form.wasteDetailsPackagingInfos,
            quantity: form.wasteDetailsQuantity
          }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le producteur doit signer pour valider l'enlèvement.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should fail when not signed by transporter", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const emitterCompany = await companyFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        sentAt: null,
        status: "SEALED",
        emitterCompanyName: emitterCompany.name,
        emitterCompanySiret: emitterCompany.siret,
        transporters: {
          create: {
            transporterCompanyName: company.name,
            transporterCompanySiret: company.siret,
            number: 1
          }
        }
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "signedByTransporter">>(
      SIGNED_BY_TRANSPORTER,
      {
        variables: {
          id: form.id,
          signingInfo: {
            sentAt: "2018-12-11T00:00:00.000Z",
            signedByTransporter: false,
            securityCode: 1234,
            sentBy: "Roger Lapince",
            signedByProducer: true,
            packagingInfos: form.wasteDetailsPackagingInfos,
            quantity: form.wasteDetailsQuantity
          }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le transporteur doit signer pour valider l'enlèvement.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should fail when signed by an intermediary", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const emitterCompany = await companyFactory();
    const intermediary = await userWithCompanyFactory(UserRole.MEMBER);
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        sentAt: null,
        status: "SEALED",
        emitterCompanyName: emitterCompany.name,
        emitterCompanySiret: emitterCompany.siret,
        transporters: {
          create: {
            transporterCompanyName: company.name,
            transporterCompanySiret: company.siret,
            number: 1
          }
        },
        intermediaries: {
          create: [toIntermediaryCompany(intermediary.company)]
        }
      }
    });

    const { mutate } = makeClient(intermediary.user);
    const { errors } = await mutate<Pick<Mutation, "signedByTransporter">>(
      SIGNED_BY_TRANSPORTER,
      {
        variables: {
          id: form.id,
          signingInfo: {
            sentAt: "2018-12-11T00:00:00.000Z",
            signedByTransporter: false,
            securityCode: 1234,
            sentBy: "Roger Lapince",
            signedByProducer: true,
            packagingInfos: form.wasteDetailsPackagingInfos,
            quantity: form.wasteDetailsQuantity
          }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous n'êtes pas autorisé à signer ce bordereau pour le transport",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should succeed when providing the eco-organisme's security code", async () => {
    const { user, company: transporter } = await userWithCompanyFactory(
      "ADMIN"
    );
    await transporterReceiptFactory({ company: transporter });

    const emitter = await companyFactory();
    const ecoOrganisme = await companyFactory({
      securityCode: 6789,
      companyTypes: {
        set: ["ECO_ORGANISME"]
      }
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        sentAt: null,
        status: "SEALED",
        emitterCompanyName: emitter.name,
        emitterCompanySiret: emitter.siret,
        transporters: {
          create: {
            transporterCompanyName: transporter.name,
            transporterCompanySiret: transporter.siret,
            number: 1
          }
        },
        ecoOrganismeName: ecoOrganisme.name,
        ecoOrganismeSiret: ecoOrganisme.siret
      }
    });

    const { mutate } = makeClient(user);
    await mutate<Pick<Mutation, "signedByTransporter">>(SIGNED_BY_TRANSPORTER, {
      variables: {
        id: form.id,
        signingInfo: {
          sentAt: "2018-12-11T00:00:00.000Z",
          signedByTransporter: true,
          securityCode: ecoOrganisme.securityCode,
          signatureAuthor: "ECO_ORGANISME",
          sentBy: "Roger Lapince",
          signedByProducer: true,
          packagingInfos: form.wasteDetailsPackagingInfos,
          quantity: form.wasteDetailsQuantity
        }
      }
    });

    const resultingForm = await prisma.form.findUnique({
      where: { id: form.id }
    });
    expect(resultingForm).toEqual(
      expect.objectContaining({
        status: "SENT",
        emittedByEcoOrganisme: true
      })
    );
  });

  it("should mark a form with temporary storage as signed (frame 18)", async () => {
    const transporter = await userWithCompanyFactory("ADMIN");
    const temporaryStorage = await userWithCompanyFactory("ADMIN");
    const finalRecipient = await userWithCompanyFactory("ADMIN");
    await transporterReceiptFactory({ company: transporter.company });

    const form = await formWithTempStorageFactory({
      ownerId: transporter.user.id,
      opt: {
        status: "RESEALED",
        recipientCompanyName: temporaryStorage.company.name,
        recipientCompanySiret: temporaryStorage.company.siret,
        takenOverAt: "2019-11-20T00:00:00.000Z",
        sentAt: "2019-11-20T00:00:00.000Z",
        transporters: {
          create: {
            transporterIsExemptedOfReceipt: true,
            number: 1
          }
        }
      },
      forwardedInOpts: {
        quantityReceived: 2.4,
        wasteAcceptationStatus: "ACCEPTED",
        receivedAt: "2019-11-20T00:00:00.000Z",
        receivedBy: temporaryStorage.user.name,
        signedAt: "2019-11-20T00:00:00.000Z",
        recipientCompanyName: finalRecipient.company.name,
        recipientCompanySiret: finalRecipient.company.siret,
        recipientCap: "",
        recipientProcessingOperation: "R 6",
        transporters: {
          create: {
            transporterCompanyName: transporter.company.name,
            transporterCompanySiret: transporter.company.siret,
            transporterIsExemptedOfReceipt: false,
            transporterNumberPlate: "",
            number: 1
          }
        }
      }
    });

    const resentAt = new Date("2018-12-11T00:00:00.000Z");

    const { mutate } = makeClient(transporter.user);
    await mutate<Pick<Mutation, "signedByTransporter">>(SIGNED_BY_TRANSPORTER, {
      variables: {
        id: form.id,
        signingInfo: {
          sentAt: resentAt.toISOString(),
          signedByTransporter: true,
          securityCode: temporaryStorage.company.securityCode,
          sentBy: temporaryStorage.user.name,
          signedByProducer: true,
          packagingInfos: form.wasteDetailsPackagingInfos,
          quantity: form.wasteDetailsQuantity,
          onuCode: "Code ONU"
        }
      }
    });

    const resultingForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: { forwardedIn: true }
    });

    expect(resultingForm).toEqual(
      expect.objectContaining({
        status: "RESENT",
        forwardedIn: expect.objectContaining({
          signedAt: resentAt,
          signedBy: temporaryStorage.user.name,
          emittedAt: resentAt,
          emittedBy: temporaryStorage.user.name,
          takenOverAt: resentAt,
          takenOverBy: transporter.user.name
        })
      })
    );
  });

  test.each(allowedFormats)(
    "%p should be a valid format for sentAt",
    async f => {
      const { user, company } = await userWithCompanyFactory("ADMIN");
      await transporterReceiptFactory({ company });

      const emitterCompany = await companyFactory();
      // convert sentAt to formatted string
      const sentAt = new Date("2018-12-11");
      const sentAtStr = format(sentAt, f);

      const form = await formFactory({
        ownerId: user.id,
        opt: {
          sentAt: null,
          status: "SEALED",
          emitterCompanyName: emitterCompany.name,
          emitterCompanySiret: emitterCompany.siret,
          transporters: {
            create: {
              transporterCompanyName: company.name,
              transporterCompanySiret: company.siret,
              number: 1
            }
          }
        }
      });

      const { mutate } = makeClient(user);
      await mutate<Pick<Mutation, "signedByTransporter">>(
        SIGNED_BY_TRANSPORTER,
        {
          variables: {
            id: form.id,
            signingInfo: {
              sentAt: sentAtStr,
              signedByTransporter: true,
              securityCode: emitterCompany.securityCode,
              sentBy: "Roger Lapince",
              signedByProducer: true,
              packagingInfos: form.wasteDetailsPackagingInfos,
              quantity: form.wasteDetailsQuantity,
              onuCode: "Code ONU"
            }
          }
        }
      );

      const resultingForm = await prisma.form.findUniqueOrThrow({
        where: { id: form.id }
      });
      expect(resultingForm.status).toEqual(Status.SENT);
      expect(resultingForm.sentAt).toEqual(sentAt);
    }
  );

  it("should return an error if packagings is empty", async () => {
    const { user, company: transporter } = await userWithCompanyFactory(
      "ADMIN"
    );
    await transporterReceiptFactory({ company: transporter });
    const emitter = await companyFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        sentAt: null,
        status: "SEALED",
        wasteDetailsCode: "01 01 01",
        emitterCompanySiret: emitter.siret,
        wasteDetailsQuantity: 0,
        wasteDetailsPackagingInfos: [],
        transporters: {
          create: {
            transporterCompanySiret: transporter.siret,
            number: 1
          }
        }
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "signedByTransporter">>(
      SIGNED_BY_TRANSPORTER,
      {
        variables: {
          id: form.id,
          signingInfo: {
            sentAt: "2018-12-11T00:00:00.000Z",
            signedByTransporter: true,
            securityCode: emitter.securityCode,
            sentBy: "Roger Lapince",
            signedByProducer: true,
            quantity: 1
          }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le nombre de contenants doit être supérieur à 0",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
});
