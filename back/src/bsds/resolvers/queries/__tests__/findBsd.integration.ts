import { UserRole } from "@prisma/client";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { Query, QueryFindBsdArgs } from "../../../../generated/graphql/types";
import {
  formFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const FIND_BSD = gql`
  query FindBsd($id: String!) {
    findBsd(id: $id) {
      ... on Form {
        id
      }
    }
  }
`;

describe("query findBsd", () => {
  afterEach(resetDatabase);

  it("should deny access to regular users", async () => {
    const user = await userFactory({ isAdmin: false });
    const { query } = makeClient(user);
    const { errors } = await query(FIND_BSD, { variables: { id: "id" } });
    expect(errors).toEqual([
      expect.objectContaining({ message: "Vous n'êtes pas administrateur" })
    ]);
  });

  it("should return the bsd infos if user is admin", async () => {
    const admin = await userFactory({ isAdmin: true });
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);
    const { query } = makeClient(admin);
    const form = await formFactory({ ownerId: user.id });
    const { data } = await query<Pick<Query, "findBsd">, QueryFindBsdArgs>(
      FIND_BSD,
      { variables: { id: form.readableId } }
    );

    expect(data.findBsd.id).toEqual(form.id);
  });
});
