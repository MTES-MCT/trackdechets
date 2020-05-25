import {
  userWithCompanyFactory,
  formFactory,
  userFactory,
  transportSegmentFactory,
} from "../../../__tests__/factories";
import makeClient from "../../../__tests__/testClient";
import { resetDatabase } from "../../../../integration-tests/helper";
import { prisma } from "../../../generated/prisma-client";

jest.mock("axios", () => ({
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

describe("{ mutation { takeOverSegment } }", () => {
  afterAll(() => resetDatabase());

  it("", async () => {
    const owner = await userFactory();
    const {
      user: firstTransporter,
      company: firstTransporterCompany,
    } = await userWithCompanyFactory("ADMIN", "TRANSPORTER");

    const {
      user: secondTransporter,
      company: secondTransporterCompany,
    } = await userWithCompanyFactory("ADMIN", "TRANSPORTER");

    // create a form whose first transporter is another one
    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        transporterCompanySiret: firstTransporterCompany.siret,
        status: "SENT",
        currentTransporterSiret: firstTransporterCompany.siret,
        nextTransporterSiret: secondTransporterCompany.siret,
      },
    });
    // an attached sealed segment to be taken over by the second transporter
    const segment = await transportSegmentFactory({
      formId: form.id,
      segmentPayload: {
        transporterCompanySiret: secondTransporterCompany.siret,
        sealed: true,
      },
    });
    const { mutate } = makeClient(secondTransporter);
    await mutate(
      `mutation  {
            takeOverSegment(id:"${segment.id}",     
            takeOverInfo: { takenOverAt: "2020-04-28", takenOverBy: "transporter suivant" }
            ) {
              id
            }
        }`
    );

    // segment take over fields are filled
    const takenOverSegment = await prisma.transportSegment({ id: segment.id });
    expect(takenOverSegment.takenOverAt).toBe("2020-04-28T00:00:00.000Z");
    expect(takenOverSegment.takenOverBy).toBe("transporter suivant");

    // form next and currentTransporterSiret have been updated
    const udpatedForm = await prisma.form({ id: form.id });
    expect(udpatedForm.currentTransporterSiret).toBe(
      secondTransporterCompany.siret
    );
    expect(udpatedForm.nextTransporterSiret).toBe("");
  });
});
