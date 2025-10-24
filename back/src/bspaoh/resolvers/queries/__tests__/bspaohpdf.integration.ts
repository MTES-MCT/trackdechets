import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  userWithCompanyFactory,
  userWithAccessTokenFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { ErrorCode } from "../../../../common/errors";
import { bspaohFactory } from "../../../__tests__/factories";
import type { Query } from "@td/codegen-back";

import { GovernmentPermission } from "@td/prisma";
import { faker } from "@faker-js/faker";
import { app } from "../../../../server";
import { gql } from "graphql-tag";
import supertest from "supertest";

const BSPAOH_PDF = gql`
  query Bspaohdf($id: ID!) {
    bspaohPdf(id: $id) {
      token
    }
  }
`;

describe("Query.BspaohPdf", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { query } = makeClient();
    const { company } = await userWithCompanyFactory("MEMBER");
    const paoh = await bspaohFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { errors } = await query<Pick<Query, "bspaohPdf">>(BSPAOH_PDF, {
      variables: { id: paoh.id }
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
    const { company } = await userWithCompanyFactory("MEMBER");
    const paoh = await bspaohFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });
    const { user: otherUser } = await userWithCompanyFactory("MEMBER");

    const { query } = makeClient(otherUser);
    const { errors } = await query<Pick<Query, "bspaohPdf">>(BSPAOH_PDF, {
      variables: { id: paoh.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous n'êtes pas autorisé à accéder au récépissé PDF de ce BSPAOH.",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should return a token for requested id", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const paoh = await bspaohFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bspaohPdf">>(BSPAOH_PDF, {
      variables: { id: paoh.id }
    });

    expect(data.bspaohPdf.token).toBeTruthy();
  });

  it("should allow pdf access to user authenticated with a token when tied to a government account with relevant perms", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const paoh = await bspaohFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

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
        query: `{bspaohPdf(id: "${paoh.id}") {token}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);
    const { errors, data } = res.body;

    expect(errors).toBeUndefined();
    expect(data.bspaohPdf.token).toBeTruthy();
  });

  it("should forbid pdf access to user authenticated with a token when tied to a government account without relevant perms", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const paoh = await bspaohFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });
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
        query: `{bspaohPdf(id: "${paoh.id}") {token}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);
    const { errors, data } = res.body;

    expect(data).toBeNull();
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(`Vous n'êtes pas connecté.`);
  });

  it("should forbid user authenticated with a token tied to a government account when IPs do not match", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
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
    const paoh = await bspaohFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const res = await request
      .post("/")
      .send({
        query: `{bspaohPdf(id: "${paoh.id}") {token}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", userIP); // IPs do not match
    const { errors, data } = res.body;
    expect(data).toBeNull();
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(`Vous n'êtes pas connecté.`);
  });
});
