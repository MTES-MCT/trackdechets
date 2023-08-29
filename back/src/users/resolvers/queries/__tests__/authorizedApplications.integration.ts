import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  applicationFactory,
  userFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import prisma from "../../../../prisma";
import { Query } from "../../../../generated/graphql/types";

const AUTHORIZED_APPLICATIONS = gql`
  query {
    authorizedApplications {
      id
      name
      lastConnection
    }
  }
`;

describe("query authorizedApplications", () => {
  afterAll(resetDatabase);

  it("should return authorized applications", async () => {
    const user = await userFactory();
    const application1 = await applicationFactory();
    const application2 = await applicationFactory();
    await applicationFactory();

    await prisma.accessToken.create({
      data: {
        userId: user.id,
        applicationId: application1.id,
        token: "token1",
        lastUsed: new Date("2022-01-01")
      }
    });

    const accessToken2 = await prisma.accessToken.create({
      data: {
        userId: user.id,
        applicationId: application1.id,
        token: "token2",
        lastUsed: new Date("2022-01-02")
      }
    });

    await prisma.accessToken.create({
      data: {
        userId: user.id,
        applicationId: application2.id,
        token: "token3",
        lastUsed: new Date("2022-02-01")
      }
    });

    // access token without application
    await prisma.accessToken.create({
      data: {
        userId: user.id,
        token: "token4",
        lastUsed: new Date("2022-01-01")
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "authorizedApplications">>(
      AUTHORIZED_APPLICATIONS
    );

    expect(data.authorizedApplications).toHaveLength(2);
    expect(data.authorizedApplications).toEqual([
      expect.objectContaining({ id: application1.id, name: application1.name }),
      expect.objectContaining({ id: application2.id, name: application2.name })
    ]);
    expect(data.authorizedApplications[0].lastConnection).toEqual(
      accessToken2!.lastUsed!.toISOString()
    );
  });
});
