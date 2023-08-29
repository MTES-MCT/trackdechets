import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import {
  applicationFactory,
  userFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const DELETE_APPLICATION = gql`
  mutation DeleteApplication($id: ID!) {
    deleteApplication(id: $id) {
      id
    }
  }
`;

describe("mutation deleteApplication", () => {
  afterAll(resetDatabase);

  it("should delete an application and revoke all associated tokens", async () => {
    const application = await applicationFactory();
    const admin = await prisma.user.findFirstOrThrow({
      where: { id: application.adminId! }
    });
    const user = await userFactory();
    let applicationAccessToken = await prisma.accessToken.create({
      data: { userId: user.id, applicationId: application.id, token: "token1" }
    });
    let personnalAccessToken = await prisma.accessToken.create({
      data: { userId: user.id, token: "token2" }
    });
    const { mutate } = makeClient(admin);
    await mutate(DELETE_APPLICATION, { variables: { id: application.id } });
    const deletedApplication = await prisma.application.findFirst({
      where: { id: application.id }
    });
    expect(deletedApplication).toEqual(null);
    applicationAccessToken = await prisma.accessToken.findFirstOrThrow({
      where: { id: applicationAccessToken.id }
    });
    personnalAccessToken = await prisma.accessToken.findFirstOrThrow({
      where: { id: personnalAccessToken.id }
    });
    expect(applicationAccessToken.isRevoked).toEqual(true);
    expect(personnalAccessToken.isRevoked).toEqual(false);
  });
});
