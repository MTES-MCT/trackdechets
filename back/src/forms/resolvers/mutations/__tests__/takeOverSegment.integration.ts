import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import {
  formFactory,
  transportSegmentFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

jest.mock("axios", () => ({
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} }))
  }
}));

describe("{ mutation { takeOverSegment } }", () => {
  afterAll(() => resetDatabase());

  it("should take a segment over", async () => {
    const owner = await userFactory();
    const { company: firstTransporterCompany } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: { set: ["TRANSPORTER"] }
      }
    );

    const { user: secondTransporter, company: secondTransporterCompany } =
      await userWithCompanyFactory("ADMIN", {
        companyTypes: { set: ["TRANSPORTER"] }
      });

    // create a form whose first transporter is another one
    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        status: "SENT",
        currentTransporterOrgId: firstTransporterCompany.siret,
        nextTransporterOrgId: secondTransporterCompany.siret,
        transporters: {
          create: {
            transporterCompanySiret: firstTransporterCompany.siret,
            number: 1
          }
        }
      }
    });
    // an attached readyToTakeOver segment to be taken over by the second transporter
    const segment = await transportSegmentFactory({
      formId: form.id,
      segmentPayload: {
        transporterCompanySiret: secondTransporterCompany.siret,
        transporterCompanyAddress: "tatooïne",
        transporterCompanyContact: "Obi wan kenobi",
        transporterCompanyPhone: "0612345678",
        transporterCompanyMail: "obi@theresistance.sw",
        transporterReceipt: "R2D2",
        transporterDepartment: "83",
        readyToTakeOver: true,
        transporterTransportMode: "ROAD"
      }
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
    const takenOverSegment = await prisma.bsddTransporter.findUniqueOrThrow({
      where: { id: segment.id }
    });

    expect(takenOverSegment.takenOverAt!.toISOString()).toBe(
      "2020-04-28T00:00:00.000Z"
    );
    expect(takenOverSegment.takenOverBy).toBe("transporter suivant");

    // form next and currentTransporterOrgId have been updated
    const udpatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });
    expect(udpatedForm.currentTransporterOrgId).toBe(
      secondTransporterCompany.siret
    );
    expect(udpatedForm.nextTransporterOrgId).toBe("");
  });
});
