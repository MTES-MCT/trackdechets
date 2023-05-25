import {
  userWithCompanyFactory,
  formFactory,
  userFactory,
  transportSegmentFactory,
  siretify
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

    const transporterOrgId = company.orgId;
    // create a form whose first transporter is another one
    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        transporters: {
          create: {
            transporterCompanySiret: transporterOrgId,
            number: 1,
            takenOverAt: new Date(),
            takenOverBy: "John Snow"
          }
        },
        status: "SENT",
        currentTransporterOrgId: transporterOrgId
      }
    });
    const transporterCompanySiret = siretify(2);
    const { mutate } = makeClient(firstTransporter);
    const { data } = await mutate<Pick<Mutation, "prepareSegment">>(
      `mutation  {
        prepareSegment(id:"${form.id}",
        siret:"${transporterOrgId}",
         nextSegmentInfo: {
            transporter: {
              company: {
                siret: "${transporterCompanySiret}"
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

    const segment = await prisma.bsddTransporter.findUniqueOrThrow({
      where: { id: data.prepareSegment.id }
    });

    expect(segment.transporterCompanySiret).toBe(transporterCompanySiret);
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

    const transporterOrgId = company.orgId;
    // create a form whose first transporter is another one
    const form = await formFactory({
      ownerId: firstTransporter.id,
      opt: {
        transporters: {
          create: {
            transporterCompanySiret: transporterOrgId,
            number: 1,
            takenOverAt: new Date(),
            takenOverBy: "John Snow"
          }
        },
        status: "SENT",
        currentTransporterOrgId: transporterOrgId
      }
    });
    const transporterCompanySiret = siretify(2);
    const { mutate } = makeClient(firstTransporter);
    const { data } = await mutate<Pick<Mutation, "prepareSegment">>(
      `mutation  {
        prepareSegment(id:"${form.id}",
        siret:"${transporterOrgId}",
        nextSegmentInfo: {
          transporter: {
            company: {
              siret: "${transporterCompanySiret}"
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

    const segment = await prisma.bsddTransporter.findUniqueOrThrow({
      where: { id: data.prepareSegment.id }
    });

    expect(segment.transporterCompanySiret).toBe(transporterCompanySiret);
    expect(segment.transporterCompanyName).toBe("Nightwatch fight club");
    expect(segment.readyToTakeOver).toBe(false);
  });

  it("should create multiple segments and return the created segment id", async () => {
    // after a regression where the returned segment was not the created one, this test ensures the fixed code works
    const owner = await userFactory();
    const { user: firstTransporter, company } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: { set: ["TRANSPORTER"] }
      }
    );
    const { user: secondTransporter, company: company2 } =
      await userWithCompanyFactory("ADMIN", {
        companyTypes: { set: ["TRANSPORTER"] }
      });
    const { user: thirdTransporter, company: company3 } =
      await userWithCompanyFactory("ADMIN", {
        companyTypes: { set: ["TRANSPORTER"] }
      });

    // create dictinct form/segment
    const otherForm = await formFactory({
      ownerId: owner.id
    });
    const transporterCompanySiret = siretify(3);
    await transportSegmentFactory({
      formId: otherForm.id,
      segmentPayload: { transporterCompanySiret }
    });

    const transporterOrgId = company.orgId;
    // create a form whose first transporter is another one
    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        transporters: {
          create: {
            transporterCompanySiret: transporterOrgId,
            takenOverAt: new Date(),
            takenOverBy: "John Snow"
          }
        },
        status: "SENT",
        currentTransporterOrgId: transporterOrgId
      }
    });

    const { mutate } = makeClient(firstTransporter);
    const { data } = await mutate<Pick<Mutation, "prepareSegment">>(
      `mutation  {
        prepareSegment(id:"${form.id}",
          siret:"${transporterOrgId}",
          nextSegmentInfo: {
            transporter: {
              company: {
                siret: "${company2.siret}"
                name: "Nightwatch fight club"
                address: "The north wall"
                contact: "John Snow"
                phone: "0475848484"
                mail: "toto@mail.com"
              }
              isExemptedOfReceipt: true
            }
            mode: ROAD
          }) {
              id
              transporter {
                company {
                  siret
                }
              }
          }
      }`
    );

    expect(data.prepareSegment.transporter!.company!.siret).toBe(
      company2.siret
    );
    const segment = await prisma.bsddTransporter.findFirstOrThrow({
      where: { form: { id: form.id }, number: 2 }
    });

    expect(segment.id).toBe(data.prepareSegment.id);
    const { errors: markReadyErrors } = await mutate(
      `mutation  {
          markSegmentAsReadyToTakeOver(id:"${segment.id}") {
            id
          }
      }`
    );

    expect(markReadyErrors).toBeUndefined();
    const { mutate: mutate2 } = makeClient(secondTransporter);
    const { errors: takeOverErrors } = await mutate2(
      `mutation  {
        takeOverSegment(id:"${segment.id}",
          takeOverInfo: { takenOverAt: "2020-04-28", takenOverBy: "transporter suivant" }
          ) {
            id
          }
      }`
    );

    expect(takeOverErrors).toBeUndefined();
    const { data: data2 } = await mutate2<Pick<Mutation, "prepareSegment">>(
      `mutation  {
        prepareSegment(id:"${form.id}",
         siret:"${company2.orgId}",
         nextSegmentInfo: {
            transporter: {
              company: {
                siret: "${company3.siret}"
                name: "Nightwatch fight club"
                address: "The north wall"
                contact: "John Snow"
                phone: "0475848484"
                mail: "toto@mail.com"
              }
              isExemptedOfReceipt: true
            }
            mode: ROAD
          }) {
              id
              transporter {
                company {
                  siret
                }
              }
          }
      }`
    );

    expect(data2.prepareSegment.transporter!.company!.siret).toBe(
      company3.siret
    );
    const { errors: markReadyErrors2 } = await mutate2(
      `mutation  {
        markSegmentAsReadyToTakeOver(id:"${data2.prepareSegment.id}") {
          id
        }
      }`
    );

    expect(markReadyErrors2).toBeUndefined();
    const { mutate: mutate3 } = makeClient(thirdTransporter);
    // should not allow to prepare befor takeOver segment
    const { errors: errorToPrepare } = await mutate3<
      Pick<Mutation, "prepareSegment">
    >(
      `mutation  {
      prepareSegment(id:"${form.id}",
        siret:"${company3.orgId}",
        nextSegmentInfo: {
          transporter: {
            company: {
              siret: "${transporterCompanySiret}"
              name: "Nightwatch fight club"
              address: "The north wall"
              contact: "John Snow"
              phone: "0475848484"
              mail: "toto@mail.com"
            }
            isExemptedOfReceipt: true
          }
          mode: ROAD
        }) {
            id
            transporter {
              company {
                siret
              }
            }
        }
    }`
    );
    expect(errorToPrepare.length).toBe(1);
    expect(errorToPrepare[0].extensions.code).toBe("FORBIDDEN");
    expect(errorToPrepare[0].message).toBe(
      "Vous ne disposez pas des permissions nécessaires"
    );
    const { errors: takeOverErrors2 } = await mutate3(
      `mutation  {
        takeOverSegment(id:"${data2.prepareSegment.id}",
          takeOverInfo: { takenOverAt: "2020-04-28", takenOverBy: "transporter suivant" }
          ) {
            id
          }
      }`
    );

    expect(takeOverErrors2).toBeUndefined();
    const { data: data3, errors } = await mutate3<
      Pick<Mutation, "prepareSegment">
    >(
      `mutation  {
        prepareSegment(id:"${form.id}",
          siret:"${company3.orgId}",
          nextSegmentInfo: {
            transporter: {
              company: {
                siret: "${transporterCompanySiret}"
                name: "Nightwatch fight club"
                address: "The north wall"
                contact: "John Snow"
                phone: "0475848484"
                mail: "toto@mail.com"
              }
              isExemptedOfReceipt: true
            }
            mode: ROAD
          }) {
              id
              transporter {
                company {
                  siret
                }
              }
          }
      }`
    );
    expect(errors).toBeUndefined();
    expect(data3.prepareSegment.transporter!.company!.siret).toBe(
      transporterCompanySiret
    );
  });
});
