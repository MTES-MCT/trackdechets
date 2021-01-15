import {
  userWithCompanyFactory,
  formFactory,
  userFactory,
  transportSegmentFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";

jest.mock("axios", () => ({
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} }))
  }
}));

describe("{ mutation { markSegmentAsReadyToTakeOver} }", () => {
  afterAll(() => resetDatabase());

  it("", async () => {
    const owner = await userFactory();
    const { user: firstTransporter, company } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: { set: ["TRANSPORTER"] }
      }
    );

    const transporterSiret = company.siret;
    // create a form whose first transporter is another one
    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        transporterCompanySiret: transporterSiret,
        status: "SENT",
        currentTransporterSiret: transporterSiret // siret cached to ease multimodal management
      }
    });
    // there is already one segment
    const segment = await transportSegmentFactory({
      formId: form.id,
      segmentPayload: { transporterCompanySiret: "98765" }
    });
    const { mutate } = makeClient(firstTransporter);
    await mutate(
      `mutation  {
            markSegmentAsReadyToTakeOver(id:"${segment.id}") {
              id
            }
        }`
    );

    const readyToTakeOverSegment = await prisma.transportSegment.findUnique({
      where: { id: segment.id }
    });
    expect(readyToTakeOverSegment.readyToTakeOver).toBe(true);
  });
});
