import {
  userWithCompanyFactory,
  formFactory,
  userFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { Mutation } from "../../../../generated/graphql/types";

jest.mock("axios", () => ({
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} }))
  }
}));

describe("{ mutation { prepareSegment } }", () => {
  afterAll(() => resetDatabase());

  it("should create a segment", async () => {
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

    const { mutate } = makeClient(firstTransporter);
    const { data } = await mutate<Pick<Mutation, "prepareSegment">>(
      `mutation  {
        prepareSegment(id:"${form.id}",
         siret:"${transporterSiret}",
         nextSegmentInfo: {
            transporter: {
              company: {
                siret: "976345"
                name: "Nightwatch fight club"
                address: "The north wall"
                contact: "John Snow"
              }
            }
            mode: ROAD
          }) {
              id
          }
      }`
    );

    const segment = await prisma.transportSegment.findUnique({
      where: { id: data.prepareSegment.id }
    });

    expect(segment.transporterCompanySiret).toBe("976345");
    expect(segment.transporterCompanyName).toBe("Nightwatch fight club");
    expect(segment.readyToTakeOver).toBe(false);
  });

  it("should create a segment when user is transporter and form owner", async () => {
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

    const { mutate } = makeClient(firstTransporter);
    const { data } = await mutate<Pick<Mutation, "prepareSegment">>(
      `mutation  {
        prepareSegment(id:"${form.id}",
         siret:"${transporterSiret}",
         nextSegmentInfo: {
            transporter: {
              company: {
                siret: "976345"
                name: "Nightwatch fight club"
                address: "The north wall"
                contact: "John Snow"
              }
            }
            mode: ROAD
          }) {
              id
          }
      }`
    );

    const segment = await prisma.transportSegment.findUnique({
      where: { id: data.prepareSegment.id }
    });

    expect(segment.transporterCompanySiret).toBe("976345");
    expect(segment.transporterCompanyName).toBe("Nightwatch fight club");
    expect(segment.readyToTakeOver).toBe(false);
  });
});
