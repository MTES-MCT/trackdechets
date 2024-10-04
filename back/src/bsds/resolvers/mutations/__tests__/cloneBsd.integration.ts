import gql from "graphql-tag";
import { formFactory, userFactory } from "../../../../__tests__/factories";
import { Mutation } from "../../../../generated/graphql/types";
import makeClient from "../../../../__tests__/testClient";

const CLONE_BSD = gql`
  mutation cloneBsd($id: String!) {
    cloneBsd(id: $id)
  }
`;

describe("mutation cloneBsd", () => {
  it("should clone regular BSDD", async () => {
    // Given
    const user = await userFactory();
    const bsdd = await formFactory({ ownerId: user.id });

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "cloneBsd">>(CLONE_BSD, {
      variables: {
        id: bsdd.id
      }
    });

    // Then
    expect(errors).toBeUndefined();
  });
});
