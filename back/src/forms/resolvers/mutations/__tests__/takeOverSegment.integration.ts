import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import {
  formFactory,
  bsddTransporterFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { gql } from "graphql-tag";
import type { Mutation, MutationTakeOverSegmentArgs } from "@td/codegen-back";

jest.mock("axios", () => ({
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} }))
  }
}));

export const TAKE_OVER_SEGMENT = gql`
  mutation TakeOverSegment($id: ID!, $takeOverInfo: TakeOverInput!) {
    takeOverSegment(id: $id, takeOverInfo: $takeOverInfo) {
      id
    }
  }
`;

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
    const segment = await bsddTransporterFactory({
      formId: form.id,
      opts: {
        transporterCompanySiret: secondTransporterCompany.siret,
        transporterCompanyAddress: "tatooïne",
        transporterCompanyContact: "Obi wan kenobi",
        transporterCompanyPhone: "0612345678",
        transporterCompanyMail: "obi@theresistance.sw",
        transporterReceipt: "R2D2",
        transporterDepartment: "83",
        readyToTakeOver: true,
        transporterTransportMode: "ROAD",
        transporterNumberPlate: "AD_007-UV"
      }
    });
    const { mutate } = makeClient(secondTransporter);

    await mutate<
      Pick<Mutation, "takeOverSegment">,
      MutationTakeOverSegmentArgs
    >(TAKE_OVER_SEGMENT, {
      variables: {
        id: segment.id,
        takeOverInfo: {
          takenOverAt: "2020-04-28" as any,
          takenOverBy: "transporter suivant"
        }
      }
    });

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

  it("should throw validation error if plate is not specified", async () => {
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
    const segment = await bsddTransporterFactory({
      formId: form.id,
      opts: {
        transporterCompanySiret: secondTransporterCompany.siret,
        transporterCompanyAddress: "tatooïne",
        transporterCompanyContact: "Obi wan kenobi",
        transporterCompanyPhone: "0612345678",
        transporterCompanyMail: "obi@theresistance.sw",
        transporterReceipt: "R2D2",
        transporterDepartment: "83",
        readyToTakeOver: true,
        transporterTransportMode: "ROAD",
        transporterNumberPlate: null // missing plate
      }
    });
    const { mutate } = makeClient(secondTransporter);

    // Une erreur est levée si on tente de signer un segment sans plaque
    // d'immatriculation
    const { errors } = await mutate<
      Pick<Mutation, "takeOverSegment">,
      MutationTakeOverSegmentArgs
    >(TAKE_OVER_SEGMENT, {
      variables: {
        id: segment.id,
        takeOverInfo: {
          takenOverAt: "2020-04-28" as any,
          takenOverBy: "transporter suivant"
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Erreur, impossible de prendre en charge le bordereau car ces champs ne sont pas renseignés, veuillez editer le segment pour le prendre en charge." +
          "\nErreur(s): La plaque d'immatriculation est requise"
      })
    ]);

    // Il est possible en revanche de signer en spécifiant la plaque
    await mutate<
      Pick<Mutation, "takeOverSegment">,
      MutationTakeOverSegmentArgs
    >(TAKE_OVER_SEGMENT, {
      variables: {
        id: segment.id,
        takeOverInfo: {
          takenOverAt: "2020-04-28" as any,
          takenOverBy: "transporter suivant",
          numberPlate: "AD-007-UV"
        }
      }
    });

    // segment take over fields are filled
    const takenOverSegment = await prisma.bsddTransporter.findUniqueOrThrow({
      where: { id: segment.id }
    });
    expect(takenOverSegment.transporterNumberPlate).toEqual("AD-007-UV");
  });
});
