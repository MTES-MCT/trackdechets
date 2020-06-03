import {
  userWithCompanyFactory,
  formFactory,
  userFactory,
  transportSegmentFactory
} from "../../../__tests__/factories";
import makeClient from "../../../__tests__/testClient";
import { resetDatabase } from "../../../../integration-tests/helper";
import { prisma } from "../../../generated/prisma-client";

jest.mock("axios", () => ({
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} }))
  }
}));

describe("{ mutation { markSegmentAsSealed } }", () => {
  afterAll(() => resetDatabase());

  it("", async () => {
    const owner = await userFactory();
    const { user: firstTransporter, company } = await userWithCompanyFactory(
      "ADMIN",
      "TRANSPORTER"
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
            markSegmentAsSealed(id:"${segment.id}") {
              id
            }
        }`
    );

    const sealedSegment = await prisma.transportSegment({ id: segment.id });
    expect(sealedSegment.sealed).toBe(true);
  });
});
