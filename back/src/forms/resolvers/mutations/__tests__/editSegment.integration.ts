import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import {
  formFactory,
  siretify,
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

describe("{ mutation { editSegment } }", () => {
  afterAll(() => resetDatabase());

  it("should edit a segment", async () => {
    const owner = await userFactory();
    const { user: firstTransporter, company } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: { set: ["TRANSPORTER"] }
      }
    );

    const transporterOrgId = company.orgId;
    // create a form whose first transporter is another one
    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        transporters: {
          create: {
            transporterCompanySiret: transporterOrgId,
            number: 1
          }
        },
        status: "SENT",
        currentTransporterOrgId: transporterOrgId
      }
    });
    // there is already one segment
    const segment = await transportSegmentFactory({
      formId: form.id,
      segmentPayload: { transporterCompanySiret: "98765" }
    });

    const { mutate } = makeClient(firstTransporter);
    const editSegmentSiret = siretify(2);
    await mutate(
      `mutation  {
            editSegment(id:"${segment.id}", siret:"${transporterOrgId}", nextSegmentInfo: {
                transporter: {
                  company: {
                    siret: "${editSegmentSiret}"
                    name: "White walkers social club"
                    address: "King's landing"
                    contact: "The king of the night"
                  }
                }
                mode: ROAD
              }) {
                id
              }
          }`
    );

    const editedSegment = await prisma.bsddTransporter.findUniqueOrThrow({
      where: { id: segment.id }
    });
    expect(editedSegment.transporterCompanySiret).toBe(editSegmentSiret);
  });

  it("should edit a segment when user is transporter and form owner", async () => {
    const { user: firstTransporter, company } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: { set: ["TRANSPORTER"] }
      }
    );

    const transporterOrgId = company.orgId;
    // create a form whose first transporter is another one
    const form = await formFactory({
      ownerId: firstTransporter.id,
      opt: {
        transporters: {
          create: {
            transporterCompanySiret: transporterOrgId,
            number: 1
          }
        },
        status: "SENT",
        currentTransporterOrgId: transporterOrgId
      }
    });
    // there is already one segment
    const segment = await transportSegmentFactory({
      formId: form.id,
      segmentPayload: { transporterCompanySiret: "98765" }
    });

    const { mutate } = makeClient(firstTransporter);
    const editSegmentSiret = siretify(3);
    await mutate(
      `mutation  {
            editSegment(id:"${segment.id}", siret:"${transporterOrgId}",   nextSegmentInfo: {
                transporter: {
                  company: {
                    siret: "${editSegmentSiret}"
                    name: "White walkers social club"
                    address: "King's landing"
                    contact: "The king of the night"
                  }
                }
                mode: ROAD
              }) {
                id
              }
          }`
    );

    const editedSegment = await prisma.bsddTransporter.findUniqueOrThrow({
      where: { id: segment.id }
    });
    expect(editedSegment.transporterCompanySiret).toBe(editSegmentSiret);
  });

  it("should edit a segment when user is the second transporter", async () => {
    const { user: firstTransporter, company: firstTransporterCompany } =
      await userWithCompanyFactory("ADMIN", {
        companyTypes: { set: ["TRANSPORTER"] }
      });
    const { user: secondTransporter, company: secondTransporterCompany } =
      await userWithCompanyFactory("ADMIN", {
        companyTypes: { set: ["TRANSPORTER"] }
      });

    const firstTransporterSiret = firstTransporterCompany.siret;
    // create a form whose first transporter is another one
    const form = await formFactory({
      ownerId: firstTransporter.id,
      opt: {
        transporters: {
          create: {
            transporterCompanySiret: firstTransporterSiret,
            number: 1
          }
        },
        status: "SENT",
        currentTransporterOrgId: firstTransporterSiret
      }
    });
    // there is already one readyToTakeOver segment
    const segment = await transportSegmentFactory({
      formId: form.id,
      segmentPayload: {
        transporterCompanySiret: siretify(4),
        readyToTakeOver: true
      }
    });

    const { mutate } = makeClient(secondTransporter);
    await mutate(
      `mutation  {
            editSegment(id:"${segment.id}", siret:"${secondTransporterCompany.orgId}", nextSegmentInfo: {
                transporter: {
                  company: {
                    contact: "José Lannister"
                  }
                }
                mode: RAIL
              }) {
                id
              }
          }`
    );

    const editedSegment = await prisma.bsddTransporter.findUniqueOrThrow({
      where: { id: segment.id }
    });

    expect(editedSegment.transporterCompanyContact).toBe("José Lannister");
  });
});
