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
});
