import { UserRole } from "@prisma/client";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import type { Query, QueryBsdArgs } from "@td/codegen-back";
import {
  formFactory,
  userFactory,
  userWithCompanyFactory,
  adminFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const BSD = gql`
  query Bsd($id: String!) {
    bsd(id: $id) {
      ... on Form {
        id
      }
    }
  }
`;

describe("query bsd", () => {
  afterEach(resetDatabase);

  it("should deny access to regular users", async () => {
    const user = await userFactory({ isAdmin: false });
    const { query } = makeClient(user);
    const { errors } = await query(BSD, { variables: { id: "id" } });
    expect(errors).toEqual([
      expect.objectContaining({ message: "Vous n'êtes pas administrateur" })
    ]);
  });

  it("should return the bsd infos if user is admin", async () => {
    const admin = await adminFactory();
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);
    const { query } = makeClient(admin);
    const form = await formFactory({ ownerId: user.id });
    const { data } = await query<Pick<Query, "bsd">, QueryBsdArgs>(BSD, {
      variables: { id: form.readableId }
    });

    expect(data.bsd.id).toEqual(form.id);
  });
});
