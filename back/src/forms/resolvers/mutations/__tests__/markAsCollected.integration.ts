import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "../../../../generated/prisma-client";
import {
  formFactory,
  userWithCompanyFactory,
  companyFactory,
  userFactory
} from "../../../../__tests__/factories";
import { ErrorCode } from "../../../../common/errors";
import makeClient from "../../../../__tests__/testClient";

const MARK_AS_COLLECTED = `
  mutation MarkAsCollected($id: ID!, $collectedInfo: CollectedFormInput!) {
    markAsCollected(id: $id, collectedInfo: $collectedInfo){
      status
    }
  }
`;

describe("mutation marksAsCollected", () => {
  afterEach(resetDatabase);

  it("should mark as BSD as collected", async () => {
    const {
      user: owner,
      company: emitterCompany
    } = await userWithCompanyFactory("MEMBER");
    const {
      user: transporter,
      company: transporterCompany
    } = await userWithCompanyFactory("MEMBER");

    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        sentAt: null,
        status: "SEALED",
        emitterCompanyName: emitterCompany.name,
        emitterCompanySiret: emitterCompany.siret,
        transporterCompanyName: transporterCompany.name,
        transporterCompanySiret: transporterCompany.siret
      }
    });

    // We are connected with the transporter device
    const { mutate } = makeClient(transporter);

    await mutate(MARK_AS_COLLECTED, {
      variables: {
        id: form.id,
        collectedInfo: {
          sentAt: "2018-12-11T00:00:00.000Z",
          securityCode: emitterCompany.securityCode,
          sentBy: "Roger Lapince",
          packagings: form.wasteDetailsPackagings,
          quantity: form.wasteDetailsQuantity
        }
      }
    });

    const updatedForm = await prisma.form({ id: form.id });
    expect(updatedForm.status).toEqual("SENT");
  });

  it("should fail if wrong security code", async () => {
    const {
      user: owner,
      company: emitterCompany
    } = await userWithCompanyFactory("MEMBER");
    const {
      user: transporter,
      company: transporterCompany
    } = await userWithCompanyFactory("MEMBER");

    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        sentAt: null,
        status: "SEALED",
        emitterCompanyName: emitterCompany.name,
        emitterCompanySiret: emitterCompany.siret,
        transporterCompanyName: transporterCompany.name,
        transporterCompanySiret: transporterCompany.siret
      }
    });

    // We are connected with the transporter device
    const { mutate } = makeClient(transporter);

    const { errors } = await mutate(MARK_AS_COLLECTED, {
      variables: {
        id: form.id,
        collectedInfo: {
          sentAt: "2018-12-11T00:00:00.000Z",
          securityCode: 4567, // wrong
          sentBy: "Roger Lapince",
          packagings: form.wasteDetailsPackagings,
          quantity: form.wasteDetailsQuantity
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le code de sécurité de l'émetteur du bordereau est invalide.",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should mark a form with temporary storage as collected (frame 18)", async () => {
    const owner = await userFactory();
    const tempStorageCompany = await companyFactory();
    const destinationCompany = await companyFactory();
    const {
      user: transporter,
      company: transporterCompany
    } = await userWithCompanyFactory("MEMBER");

    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        status: "RESEALED",
        recipientCompanyName: tempStorageCompany.name,
        recipientCompanySiret: tempStorageCompany.siret,
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
            transporterCompanyName: transporterCompany.name,
            transporterCompanySiret: transporterCompany.siret,
            transporterIsExemptedOfReceipt: false,
            transporterReceipt: "Damned! That receipt looks good",
            transporterDepartment: "10",
            transporterValidityLimit: "2019-11-20T00:00:00.000Z",
            transporterNumberPlate: ""
          }
        }
      }
    });

    const { mutate } = makeClient(transporter);

    await mutate(MARK_AS_COLLECTED, {
      variables: {
        id: form.id,
        collectedInfo: {
          sentAt: "2018-12-11T00:00:00.000Z",
          securityCode: tempStorageCompany.securityCode,
          sentBy: "Roger Lapince",
          packagings: form.wasteDetailsPackagings,
          quantity: form.wasteDetailsQuantity
        }
      }
    });

    const resultingForm = await prisma.form({ id: form.id });
    expect(resultingForm.status).toBe("RESENT");
  });
});
