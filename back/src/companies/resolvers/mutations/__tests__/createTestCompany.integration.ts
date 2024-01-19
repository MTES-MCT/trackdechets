import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { Mutation } from "../../../../generated/graphql/types";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const CREATE_TEST_COMPANY = gql`
  mutation CreateTestCompany {
    createTestCompany
  }
`;

describe("createTestCompany", () => {
  afterEach(resetDatabase);

  it("should generate an incremental sequence of sirets", async () => {
    const user = await userFactory();
    const { mutate } = makeClient(user);
    const { data: data1 } = await mutate<Pick<Mutation, "createTestCompany">>(
      CREATE_TEST_COMPANY
    );
    const siret1 = data1.createTestCompany;
    const { data: data2 } = await mutate<Pick<Mutation, "createTestCompany">>(
      CREATE_TEST_COMPANY
    );
    const siret2 = data2.createTestCompany;
    const { data: data3 } = await mutate<Pick<Mutation, "createTestCompany">>(
      CREATE_TEST_COMPANY
    );
    const siret3 = data3.createTestCompany;
    expect(siret1).toEqual("00000000000001");
    expect(siret2).toEqual("00000000000002");
    expect(siret3).toEqual("00000000000003");
  });
});
