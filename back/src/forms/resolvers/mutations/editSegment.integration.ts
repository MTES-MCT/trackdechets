import { resetDatabase } from "integration-tests/helper";
import prisma from "src/prisma";
import {
  formFactory,
  transportSegmentFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import makeClient from "../../../__tests__/testClient";

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

    const transporterSiret = company.siret;
    // create a form whose first transporter is another one
    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        transporterCompanySiret: transporterSiret,
        status: "SENT",
        currentTransporterSiret: transporterSiret
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
            editSegment(id:"${segment.id}", siret:"${transporterSiret}", nextSegmentInfo: {
                transporter: {
                  company: {
                    siret: "5678956789"
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

    const editedSegment = await prisma.transportSegment.findOne({
      where: { id: segment.id }
    });
    expect(editedSegment.transporterCompanySiret).toBe("5678956789");
  });

  it("should edit a segment when user is transporter and form owner", async () => {
    const { user: firstTransporter, company } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: { set: ["TRANSPORTER"] }
      }
    );

    const transporterSiret = company.siret;
    // create a form whose first transporter is another one
    const form = await formFactory({
      ownerId: firstTransporter.id,
      opt: {
        transporterCompanySiret: transporterSiret,
        status: "SENT",
        currentTransporterSiret: transporterSiret
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
            editSegment(id:"${segment.id}", siret:"${transporterSiret}",   nextSegmentInfo: {
                transporter: {
                  company: {
                    siret: "5678956789"
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

    const editedSegment = await prisma.transportSegment.findOne({
      where: { id: segment.id }
    });
    expect(editedSegment.transporterCompanySiret).toBe("5678956789");
  });

  it("should edit a segment when user is the second transporter", async () => {
    const {
      user: firstTransporter,
      company: firstTransporterCompany
    } = await userWithCompanyFactory("ADMIN", {
      companyTypes: { set: ["TRANSPORTER"] }
    });
    const {
      user: secondTransporter,
      company: secondTransporterCompany
    } = await userWithCompanyFactory("ADMIN", {
      companyTypes: { set: ["TRANSPORTER"] }
    });

    const firstTransporterSiret = firstTransporterCompany.siret;
    const secondTransporterSiret = secondTransporterCompany.siret;
    // create a form whose first transporter is another one
    const form = await formFactory({
      ownerId: firstTransporter.id,
      opt: {
        transporterCompanySiret: firstTransporterSiret,
        status: "SENT",
        currentTransporterSiret: firstTransporterSiret
      }
    });
    // there is already one readyToTakeOver segment
    const segment = await transportSegmentFactory({
      formId: form.id,
      segmentPayload: {
        transporterCompanySiret: "98765",
        readyToTakeOver: true
      }
    });

    const { mutate } = makeClient(secondTransporter);
    await mutate(
      `mutation  {
            editSegment(id:"${segment.id}", siret:"${secondTransporterSiret}", nextSegmentInfo: {
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

    const editedSegment = await prisma.transportSegment.findOne({
      where: { id: segment.id }
    });

    expect(editedSegment.transporterCompanyContact).toBe("José Lannister");
  });
});
