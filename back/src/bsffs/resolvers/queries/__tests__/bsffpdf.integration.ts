import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  userWithCompanyFactory,
  userWithAccessTokenFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { ErrorCode } from "../../../../common/errors";
import { createBsff } from "../../../__tests__/factories";
import { Query } from "@td/codegen-back";

import { GovernmentPermission } from "@prisma/client";
import { faker } from "@faker-js/faker";
import { app } from "../../../../server";
import { gql } from "graphql-tag";
import supertest from "supertest";

const BSFF_PDF = gql`
  query BsvhuPdf($id: ID!) {
    bsffPdf(id: $id) {
      token
    }
  }
`;

describe("Query.BsffPdf", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { query } = makeClient();
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsff({ emitter });

    const { errors } = await query<Pick<Query, "bsffPdf">>(BSFF_PDF, {
      variables: { id: bsff.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas connecté.",
        extensions: expect.objectContaining({
          code: ErrorCode.UNAUTHENTICATED
        })
      })
    ]);
  });

  it("should forbid access to user not on the bsd", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsff({ emitter });
    const { user: otherUser } = await userWithCompanyFactory("MEMBER");

    const { query } = makeClient(otherUser);
    const { errors } = await query<Pick<Query, "bsffPdf">>(BSFF_PDF, {
      variables: { id: bsff.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous ne pouvez pas accéder à ce BSFF",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should return a token for requested id", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsff({ emitter });

    const { query } = makeClient(emitter.user);

    const { data } = await query<Pick<Query, "bsffPdf">>(BSFF_PDF, {
      variables: { id: bsff.id }
    });

    expect(data.bsffPdf.token).toBeTruthy();
  });

  it("should allow pdf access to user authenticated with a token when tied to a government account with relevant perms", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsff({ emitter });

    const allowedIP = faker.internet.ipv4();

    const { accessToken } = await userWithAccessTokenFactory({
      governmentAccount: {
        create: {
          name: "GERICO",
          permissions: [GovernmentPermission.BSDS_CAN_READ_ALL],
          authorizedOrgIds: ["ALL"],
          authorizedIPs: [allowedIP]
        }
      }
    });

    const request = supertest(app);

    const res = await request
      .post("/")
      .send({
        query: `{bsffPdf(id: "${bsff.id}") {token}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);
    const { errors, data } = res.body;

    expect(errors).toBeUndefined();
    expect(data.bsffPdf.token).toBeTruthy();
  });

  it("should forbid pdf access to user authenticated with a token when tied to a government account without relevant perms", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsff({ emitter });
    const allowedIP = faker.internet.ipv4();

    const { accessToken } = await userWithAccessTokenFactory({
      governmentAccount: {
        create: {
          name: "GERICO",
          permissions: [GovernmentPermission.REGISTRY_CAN_READ_ALL], // wrong permission
          authorizedOrgIds: ["ALL"],
          authorizedIPs: [allowedIP]
        }
      }
    });

    const request = supertest(app);

    const res = await request
      .post("/")
      .send({
        query: `{bsffPdf(id: "${bsff.id}") {token}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);
    const { errors, data } = res.body;

    expect(data).toBeNull();
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(`Vous n'êtes pas connecté.`);
  });

  it("should forbid user authenticated with a token tied to a government account when IPs do not match", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const request = supertest(app);

    const allowedIP = faker.internet.ipv4();
    const userIP = faker.internet.ipv4();
    // the gov account running the query
    const { accessToken } = await userWithAccessTokenFactory({
      governmentAccount: {
        create: {
          name: "GERICO",
          permissions: [GovernmentPermission.BSDS_CAN_READ_ALL],
          authorizedOrgIds: ["ALL"],
          authorizedIPs: [allowedIP] // not user ip
        }
      }
    });

    const bsff = await createBsff({ emitter });

    const res = await request
      .post("/")
      .send({
        query: `{bsffPdf(id: "${bsff.id}") {token}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", userIP); // IPs do not match
    const { errors, data } = res.body;
    expect(data).toBeNull();
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(`Vous n'êtes pas connecté.`);
  });
});
