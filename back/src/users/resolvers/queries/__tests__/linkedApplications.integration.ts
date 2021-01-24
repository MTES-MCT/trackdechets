import { ExecutionResult } from "graphql";
import {
  applicationFactory,
  userFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { AuthType } from "../../../../auth";
import { Query } from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import { createAccessToken } from "../../../database";
import { getUid } from "../../../../utils";

const GET_LINKED_APPLICATIONS = `
  query GetLinkedApplications {
    linkedApplications {
      id
      accessTokens {
        id
      }
    }
  }
`;

describe("Query.linkedApplications", () => {
  afterEach(resetDatabase);

  it("should return applications and their access tokens", async () => {
    const user = await userFactory();
    const application = await applicationFactory();
    const accessToken = await prisma.accessToken.create({
      data: {
        user: {
          connect: { id: user.id }
        },
        application: {
          connect: {
            id: application.id
          }
        },
        token: getUid(40)
      }
    });

    // personal access tokens should be properly omitted
    await createAccessToken(user);

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<
      ExecutionResult<Pick<Query, "linkedApplications">>
    >(GET_LINKED_APPLICATIONS);

    expect(data.linkedApplications).toEqual([
      {
        id: application.id,
        accessTokens: [
          {
            id: accessToken.id
          }
        ]
      }
    ]);
  });
});
