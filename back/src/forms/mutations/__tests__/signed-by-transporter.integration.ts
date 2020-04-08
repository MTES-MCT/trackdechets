import { createTestClient } from "apollo-server-integration-testing";
import { resetDatabase } from "../../../../integration-tests/helper";
import { prisma } from "../../../generated/prisma-client";
import { server } from "../../../server";
import {
  formFactory,
  userWithCompanyFactory,
  companyFactory
} from "../../../__tests__/factories";

jest.mock("axios", () => ({
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} }))
  }
}));

describe("Integration / Mark as processed mutation", () => {
  let user;
  let company;
  let mutate;

  beforeAll(async () => {
    const userAndCompany = await userWithCompanyFactory("ADMIN");
    user = userAndCompany.user;
    company = userAndCompany.company;
  });

  beforeEach(() => {
    // instantiate test client
    const { mutate: m, setOptions } = createTestClient({
      apolloServer: server
    });

    setOptions({
      request: {
        user
      }
    });

    mutate = m;
  });

  afterAll(async () => {
    await resetDatabase();
  });

  it("should mark a form as signed", async () => {
    const emittingCompany = await companyFactory();

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        sentAt: null,
        status: "SEALED",
        emitterCompanyName: emittingCompany.name,
        emitterCompanySiret: emittingCompany.siret,
        transporterCompanyName: company.name,
        transporterCompanySiret: company.siret
      }
    });

    const mutation = `
      mutation   {
        signedByTransporter(id: "${form.id}", signingInfo: {
          sentAt: "2018-12-11T00:00:00.000Z"
          signedByTransporter: true
          securityCode: ${emittingCompany.securityCode}
          sentBy: "Roger Lapince"
          signedByProducer: true

          packagings: ${form.wasteDetailsPackagings}
          quantity: ${form.wasteDetailsQuantity}
          onuCode: "Code ONU"
        }) {
          id
        }
      }
    `;

    await mutate(mutation);

    const resultingForm = await prisma.form({ id: form.id });
    expect(resultingForm.status).toBe("SENT");
  });

  it("should mark a form with temporary storage as signed (frame 18)", async () => {
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
            tempStorerQuantityReceived: "2.4",
            tempStorerWasteAcceptationStatus: "",
            tempStorerReceivedAt: "2019-11-20T00:00:00.000Z",
            tempStorerReceivedBy: "John Doe",
            tempStorerSignedAt: "2019-11-20T00:00:00.000Z",
            destinationIsFilledByEmitter: "",
            destinationCompanyName: destinationCompany.name,
            destinationCompanySiret: destinationCompany.siret,
            destinationCap: "",
            destinationProcessingOperation: "R 6",
            transporterCompanyName: company.name,
            transporterCompanySiret: company.siret,
            transporterIsExemptedOfReceipt: false,
            transporterReceipt: "Damned! That receipt looks good",
            transporterDepartment: "10",
            transporterValidityLimit: "",
            transporterNumberPlate: ""
          }
        }
      }
    });

    const mutation = `
      mutation   {
        signedByTransporter(id: "${form.id}", signingInfo: {
          sentAt: "2018-12-11T00:00:00.000Z"
          signedByTransporter: true
          securityCode: ${receivingCompany.securityCode}
          sentBy: "Roger Lapince"
          signedByProducer: true

          packagings: ${form.wasteDetailsPackagings}
          quantity: ${form.wasteDetailsQuantity}
          onuCode: "Code ONU"
        }) {
          id
        }
      }
    `;

    await mutate(mutation);

    const resultingForm = await prisma.form({ id: form.id });
    expect(resultingForm.status).toBe("RESENT");
  });
});
