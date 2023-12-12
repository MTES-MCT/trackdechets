import {
  userWithCompanyFactory,
  formFactory,
  userFactory,
  companyFactory,
  transporterReceiptFactory
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

  it("should mark segment as ready to take over", async () => {
    const owner = await userFactory();
    const { user: firstTransporter, company } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: { set: ["TRANSPORTER"] }
      }
    );
    const secondTransporter = await companyFactory({
      companyTypes: { set: ["TRANSPORTER"] }
    });
    const receipt = await transporterReceiptFactory({
      company: secondTransporter
    });
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
        currentTransporterOrgId: transporterOrgId // orgId cached to ease multimodal management
      }
    });
    // there is already one segment
    const segment = await prisma.bsddTransporter.create({
      data: {
        form: { connect: { id: form.id } },
        transporterCompanySiret: secondTransporter.orgId,
        transporterTransportMode: "ROAD",
        transporterCompanyAddress: "40 Boulevard Voltaire 13001 Marseille",
        transporterCompanyPhone: "01 00 00 00 00",
        transporterCompanyMail: "john.snow@trackdechets.fr",
        transporterCompanyName: "trackdechets trucks",
        transporterReceipt: receipt.receiptNumber,
        transporterDepartment: receipt.department,
        transporterValidityLimit: receipt.validityLimit,
        transporterNumberPlate: "XX-999-XX",
        transporterCompanyContact: "John Snow",
        number: 2
      }
    });

    const { mutate } = makeClient(firstTransporter);
    const { errors } = await mutate(
      `mutation  {
            markSegmentAsReadyToTakeOver(id:"${segment.id}") {
              id
            }
        }`
    );

    const readyToTakeOverSegment =
      await prisma.bsddTransporter.findUniqueOrThrow({
        where: { id: segment.id }
      });
    expect(readyToTakeOverSegment.readyToTakeOver).toBe(true);

    expect(errors).toBeUndefined();
  });

  it("should not mark segment as ready to take over if transporter receipt is not complete", async () => {
    const owner = await userFactory();
    const { user: firstTransporter, company } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: { set: ["TRANSPORTER"] }
      }
    );
    // no receipt
    const secondTransporter = await companyFactory({
      companyTypes: { set: ["TRANSPORTER"] }
    });
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
        currentTransporterOrgId: transporterOrgId // orgId cached to ease multimodal management
      }
    });
    // create another segment
    const segment = await prisma.bsddTransporter.create({
      data: {
        form: { connect: { id: form.id } },
        transporterCompanySiret: secondTransporter.orgId,
        transporterTransportMode: "ROAD",
        transporterNumberPlate: "XX-999-XX",
        transporterCompanyName: "trackdechets trucks",
        transporterCompanyAddress: "40 Boulevard Voltaire 13001 Marseille",
        transporterCompanyPhone: "01 00 00 00 00",
        transporterCompanyMail: "john.snow@trackdechets.fr",
        transporterReceipt: "receipt",
        transporterDepartment: "13",
        transporterCompanyContact: "John Snow",
        number: 2
      }
    });

    const { mutate } = makeClient(firstTransporter);
    const { errors } = await mutate(
      `mutation  {
            markSegmentAsReadyToTakeOver(id:"${segment.id}") {
              id
            }
        }`
    );

    const readyToTakeOverSegment =
      await prisma.bsddTransporter.findUniqueOrThrow({
        where: { id: segment.id }
      });
    expect(readyToTakeOverSegment.readyToTakeOver).toBe(false);

    expect(errors).not.toBeUndefined();
    expect(errors[0]?.message).toEqual(
      `Erreur, impossible de finaliser la préparation du transfert multi-modal car des champs sont manquants ou mal renseignés. \nErreur(s): Transporteur: la date limite de validité du récépissé est obligatoire - l'établissement doit renseigner son récépissé dans Trackdéchets`
    );
  });
});
