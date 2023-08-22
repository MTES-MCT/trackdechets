import { gql } from "graphql-tag";
import { companyFactory, userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  Mutation,
  MutationCreateFormTransporterArgs
} from "../../../../generated/graphql/types";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";

const CREATE_FORM_TRANSPORTER = gql`
  mutation CreateFormTransporter($input: TransporterInput!) {
    createFormTransporter(input: $input) {
      id
      company {
        siret
      }
    }
  }
`;

describe("Mutation.createFormTransporter", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient(null);
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const { errors } = await mutate<
      Pick<Mutation, "createFormTransporter">,
      MutationCreateFormTransporterArgs
    >(CREATE_FORM_TRANSPORTER, {
      variables: {
        input: {
          company: {
            siret: transporter.siret,
            name: transporter.name,
            address: transporter.address,
            contact: transporter.contact
          },
          mode: "ROAD",
          receipt: "receipt",
          department: "07",
          validityLimit: new Date().toISOString() as any
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({ message: "Vous n'êtes pas connecté." })
    ]);
  });

  it("should create a form transporter", async () => {
    const user = await userFactory();
    const { mutate } = makeClient(user);
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const { errors, data } = await mutate<
      Pick<Mutation, "createFormTransporter">,
      MutationCreateFormTransporterArgs
    >(CREATE_FORM_TRANSPORTER, {
      variables: {
        input: {
          company: {
            siret: transporter.siret,
            name: transporter.name,
            address: transporter.address,
            contact: transporter.contact
          },
          mode: "ROAD",
          receipt: "receipt",
          department: "07",
          validityLimit: new Date().toISOString() as any
        }
      }
    });
    expect(errors).toBeUndefined();
    expect(data.createFormTransporter!.id).toBeDefined();

    const bsddTransporter = await prisma.bsddTransporter.findUniqueOrThrow({
      where: { id: data.createFormTransporter!.id }
    });

    expect(bsddTransporter).toMatchObject({
      transporterCompanySiret: transporter.siret,
      transporterCompanyName: transporter.name,
      transporterCompanyAddress: transporter.address,
      transporterCompanyContact: transporter.contact,
      transporterReceipt: "receipt",
      transporterDepartment: "07",
      formId: null,
      number: 0,
      readyToTakeOver: true
    });
  });

  it("should throw error if data does not pass validation", async () => {
    const user = await userFactory();
    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createFormTransporter">,
      MutationCreateFormTransporterArgs
    >(CREATE_FORM_TRANSPORTER, {
      variables: {
        input: {
          company: {
            siret: "123"
          }
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Transporteur: 123 n'est pas un numéro de SIRET valide\n" +
          "Transporteur : l'établissement avec le SIRET 123 n'est pas inscrit sur Trackdéchets"
      })
    ]);
  });
});
