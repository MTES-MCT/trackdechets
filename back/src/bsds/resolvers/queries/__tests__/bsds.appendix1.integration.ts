import { Company, User, UserRole } from "@prisma/client";
import {
  Query,
  QueryBsdsArgs,
  Mutation,
  MutationCreateFormArgs,
  MutationMarkAsSealedArgs,
  MutationSignedByTransporterArgs,
  MutationMarkAsProcessedArgs,
  CreateFormInput,
  MutationCreateFormRevisionRequestArgs,
  MutationSubmitFormRevisionRequestApprovalArgs,
  MutationMarkAsReceivedArgs,
  MutationSignTransportFormArgs
} from "../../../../generated/graphql/types";
import {
  resetDatabase,
  refreshElasticSearch
} from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import {
  userWithCompanyFactory,
  formFactory,
  toIntermediaryCompany,
  transporterReceiptFactory,
  bsddTransporterData,
  bsddTransporterFactory,
  UserWithCompany
} from "../../../../__tests__/factories";

import { getFormForElastic, indexForm } from "../../../../forms/elastic";
import { gql } from "graphql-tag";
import { searchCompany } from "../../../../companies/search";
import { prisma } from "@td/prisma";

jest.mock("../../../../companies/search");

const GET_BSDS = `
  query GetBsds($where: BsdWhere) {
    bsds(where: $where) {
      edges {
        node {
          ... on Form {
            id
          }
        }
      }
    }
  }
`;
const GET_BSDS_INTERMEDIARIES = `
  query GetBsds($where: BsdWhere) {
    bsds(where: $where) {
      edges {
        node {
          ... on Form {
            id
            intermediaries {
              name
              siret
            }
          }
        }
      }
    }
  }
`;
const CREATE_FORM = `
mutation CreateForm($createFormInput: CreateFormInput!) {
  createForm(createFormInput: $createFormInput) {
    id
  }
}
`;

describe("Query.bsds appendix 1", () => {
  let emitter: { user: User; company: Company };
  let transporter: { user: User; company: Company };
  let recipient: { user: User; company: Company };

  let formId: string;

  beforeAll(async () => {
    emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    transporter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["TRANSPORTER"]
      }
    });
    await transporterReceiptFactory({
      company: transporter.company
    });

    recipient = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["WASTEPROCESSOR"]
      }
    });
  });
  afterAll(resetDatabase);

  describe("when a draft appendix1 is not linked to an APPENDIX1 bsdd", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(emitter.user);

      const input: CreateFormInput = {
        emitter: {
          company: {
            siret: emitter.company.siret,
            name: "MARIE PRODUCTEUR",
            address: "12 chemin des caravanes",
            contact: "Marie",
            mail: "marie@gmail.com",
            phone: "06"
          },
          type: "APPENDIX1_PRODUCER"
        },

        recipient: {
          company: {
            siret: recipient.company.siret,
            name: "JEANNE COLLECTEUR",
            address: "38 bis allée des anges",
            contact: "Jeanne",
            mail: "jeanne@gmail.com",
            phone: "06"
          },
          processingOperation: "R 1"
        },
        wasteDetails: {
          code: "01 01 01",
          name: "Stylos bille",
          consistence: "SOLID",
          packagingInfos: [
            {
              type: "BENNE",
              quantity: 1
            }
          ],
          quantityType: "ESTIMATED",
          quantity: 1
        }
      };

      const { data, errors } = await mutate<
        Pick<Mutation, "createForm">,
        MutationCreateFormArgs
      >(CREATE_FORM, {
        variables: {
          createFormInput: input
        }
      });
      expect(errors).toBeUndefined();
      formId = data.createForm.id;
      await refreshElasticSearch();
    });

    it("emitter's drafts should be empty", async () => {
      const { query } = makeClient(emitter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isDraftFor: [emitter.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([]); // we should not have any results
    });
  });
});
