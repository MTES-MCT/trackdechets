import { format } from "date-fns";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { ErrorCode } from "../../../../common/errors";
import {
  companyFactory,
  formFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { allowedFormats } from "../../../../common/dates";
import { Status } from "@prisma/client";
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
  afterAll(() => resetDatabase());

  it("should mark a form as signed with deprecated packagings field", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const emitterCompany = await companyFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        sentAt: null,
        status: "SEALED",
        emitterCompanyName: emitterCompany.name,
        emitterCompanySiret: emitterCompany.siret,
        transporterCompanyName: company.name,
        transporterCompanySiret: company.siret
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
          packagings: (form.wasteDetailsPackagingInfos as {
            type: string;
          }[]).map(p => p.type),
          quantity: form.wasteDetailsQuantity,
          onuCode: "Code ONU"
        }
      }
    });

    const resultingForm = await prisma.form.findUnique({
      where: { id: form.id }
    });
    expect(resultingForm.status).toBe("SENT");
  });

  it("should mark a form as signed", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const emitterCompany = await companyFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        sentAt: null,
        status: "SEALED",
        emitterCompanyName: emitterCompany.name,
        emitterCompanySiret: emitterCompany.siret,
        transporterCompanyName: company.name,
        transporterCompanySiret: company.siret
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
          packagingInfos: form.wasteDetailsPackagingInfos,
          quantity: form.wasteDetailsQuantity,
          onuCode: "Code ONU"
        }
      }
    });

    const resultingForm = await prisma.form.findUnique({
      where: { id: form.id }
    });
    expect(resultingForm.status).toBe("SENT");
  });

  it("should return an error if onuCode is provided empty for a dangerous waste", async () => {
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
        transporterCompanySiret: transporter.siret
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

  it("should not return an error if onuCode is provided empty for a non-dangerous waste", async () => {
    const { user, company: transporter } = await userWithCompanyFactory(
      "ADMIN"
    );
    const emitter = await companyFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        sentAt: null,
        status: "SEALED",
        wasteDetailsCode: "01 01 01",
        emitterCompanySiret: emitter.siret,
        transporterCompanySiret: transporter.siret
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
    const emitterCompany = await companyFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        sentAt: null,
        status: "SEALED",
        emitterCompanyName: emitterCompany.name,
        emitterCompanySiret: emitterCompany.siret,
        transporterCompanyName: company.name,
        transporterCompanySiret: company.siret
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
        transporterCompanyName: company.name,
        transporterCompanySiret: company.siret
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
        transporterCompanyName: company.name,
        transporterCompanySiret: company.siret
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

  it("should succeed when providing the eco-organisme's security code", async () => {
    const { user, company: transporter } = await userWithCompanyFactory(
      "ADMIN"
    );
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
        transporterCompanyName: transporter.name,
        transporterCompanySiret: transporter.siret,
        ecoOrganismeName: ecoOrganisme.name,
        ecoOrganismeSiret: ecoOrganisme.siret
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "signedByTransporter">>(
      SIGNED_BY_TRANSPORTER,
      {
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
      }
    );

    expect(data.signedByTransporter).toMatchObject({
      id: form.id,
      status: "SENT"
    });
  });

  it("should mark a form with temporary storage as signed (frame 18)", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const receivingCompany = await companyFactory();
    const destinationCompany = await companyFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "RESEALED",
        recipientCompanyName: receivingCompany.name,
        recipientCompanySiret: receivingCompany.siret,
        sentAt: "2019-11-20T00:00:00.000Z",
        temporaryStorageDetail: {
          create: {
            tempStorerQuantityType: "REAL",
            tempStorerQuantityReceived: 2.4,
            tempStorerWasteAcceptationStatus: "ACCEPTED",
            tempStorerReceivedAt: "2019-11-20T00:00:00.000Z",
            tempStorerReceivedBy: "John Doe",
            tempStorerSignedAt: "2019-11-20T00:00:00.000Z",
            destinationIsFilledByEmitter: false,
            destinationCompanyName: destinationCompany.name,
            destinationCompanySiret: destinationCompany.siret,
            destinationCap: "",
            destinationProcessingOperation: "R 6",
            transporterCompanyName: company.name,
            transporterCompanySiret: company.siret,
            transporterIsExemptedOfReceipt: false,
            transporterReceipt: "Damned! That receipt looks good",
            transporterDepartment: "10",
            transporterValidityLimit: "2019-11-20T00:00:00.000Z",
            transporterNumberPlate: ""
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
          securityCode: receivingCompany.securityCode,
          sentBy: "Roger Lapince",
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
    expect(resultingForm.status).toBe("RESENT");
  });

  test.each(allowedFormats)(
    "%p should be a valid format for sentAt",
    async f => {
      const { user, company } = await userWithCompanyFactory("ADMIN");
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
          transporterCompanyName: company.name,
          transporterCompanySiret: company.siret
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

      const resultingForm = await prisma.form.findUnique({
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
    const emitter = await companyFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        sentAt: null,
        status: "SEALED",
        wasteDetailsCode: "01 01 01",
        emitterCompanySiret: emitter.siret,
        transporterCompanySiret: transporter.siret,
        wasteDetailsQuantity: 0,
        wasteDetailsPackagingInfos: []
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
