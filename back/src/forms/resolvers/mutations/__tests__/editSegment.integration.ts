import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import {
  formFactory,
  siretify,
  bsddTransporterFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { gql } from "graphql-tag";
import {
  Mutation,
  MutationEditSegmentArgs
} from "../../../../generated/graphql/types";

jest.mock("axios", () => ({
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} }))
  }
}));

const EDIT_SEGMENT = gql`
  mutation EditSegment(
    $id: ID!
    $siret: String!
    $nextSegmentInfo: NextSegmentInfoInput!
  ) {
    editSegment(id: $id, siret: $siret, nextSegmentInfo: $nextSegmentInfo) {
      id
    }
  }
`;

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
    const segment = await bsddTransporterFactory({
      formId: form.id,
      opts: { transporterCompanySiret: "98765", readyToTakeOver: false }
    });

    const { mutate } = makeClient(firstTransporter);
    const editSegmentSiret = siretify(2);
    const { errors } = await mutate<
      Pick<Mutation, "editSegment">,
      MutationEditSegmentArgs
    >(EDIT_SEGMENT, {
      variables: {
        id: segment.id,
        siret: transporterOrgId,
        nextSegmentInfo: {
          mode: "ROAD",
          transporter: {
            company: {
              siret: editSegmentSiret,
              name: "White walkers social club",
              address: "King's landing",
              contact: "The king of the night"
            }
          }
        }
      }
    });

    expect(errors).toBeUndefined();

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
    const segment = await bsddTransporterFactory({
      formId: form.id,
      opts: { transporterCompanySiret: "98765", readyToTakeOver: false }
    });

    const { mutate } = makeClient(firstTransporter);
    const editSegmentSiret = siretify(3);

    const { errors } = await mutate<
      Pick<Mutation, "editSegment">,
      MutationEditSegmentArgs
    >(EDIT_SEGMENT, {
      variables: {
        id: segment.id,
        siret: transporterOrgId,
        nextSegmentInfo: {
          mode: "ROAD",
          transporter: {
            company: {
              siret: editSegmentSiret,
              name: "White walkers social club",
              address: "King's landing",
              contact: "The king of the night"
            }
          }
        }
      }
    });

    expect(errors).toBeUndefined();

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
    const segment = await bsddTransporterFactory({
      formId: form.id,
      opts: {
        transporterCompanySiret: siretify(4),
        readyToTakeOver: true
      }
    });

    const { mutate } = makeClient(secondTransporter);

    const { errors } = await mutate<
      Pick<Mutation, "editSegment">,
      MutationEditSegmentArgs
    >(EDIT_SEGMENT, {
      variables: {
        id: segment.id,
        siret: secondTransporterCompany.orgId,
        nextSegmentInfo: {
          mode: "RAIL",
          transporter: {
            company: {
              contact: "José Lannister"
            }
          }
        }
      }
    });

    expect(errors).toBeUndefined();

    const editedSegment = await prisma.bsddTransporter.findUniqueOrThrow({
      where: { id: segment.id }
    });

    expect(editedSegment.transporterCompanyContact).toBe("José Lannister");
  });
});
