import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  userWithCompanyFactory,
  userWithAccessTokenFactory,
  formFactory
} from "../../../../__tests__/factories";
import { GovernmentPermission } from "@prisma/client";

import makeClient from "../../../../__tests__/testClient";
import { ErrorCode } from "../../../../common/errors";

import { Query } from "@td/codegen-back";
import supertest from "supertest";
import { faker } from "@faker-js/faker";
import { app } from "../../../../server";

import { gql } from "graphql-tag";

const FORM_PDF = gql`
  query FormPdf($id: ID!) {
    formPdf(id: $id) {
      token
    }
  }
`;

describe("Query.FormPdf", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { query } = makeClient();
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });

    const { errors } = await query<Pick<Query, "formPdf">>(FORM_PDF, {
      variables: { id: bsdd.id }
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

  it("should forbid access to user not on the bsdd", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });
    const { user: otherUser } = await userWithCompanyFactory("MEMBER");

    const { query } = makeClient(otherUser);
    const { errors } = await query<Pick<Query, "formPdf">>(FORM_PDF, {
      variables: { id: bsdd.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas autorisé à accéder à ce bordereau",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should return a token for requested id", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "formPdf">>(FORM_PDF, {
      variables: { id: bsdd.id }
    });

    expect(data.formPdf.token).toBeTruthy();
  });

  it("should allow pdf access to user authenticated with a token when tied to a government account with relevant perms", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
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
        query: `{formPdf(id: "${bsdd.id}") {token}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);
    const { errors, data } = res.body;

    expect(errors).toBeUndefined();
    expect(data.formPdf.token).toBeTruthy();
  });

  it("should forbid pdf access to user authenticated with a token when tied to a government account without relevant perms", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
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
        query: `{formPdf(id: "${bsdd.id}") {token}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);
    const { errors, data } = res.body;

    expect(data).toBeNull();
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(`Vous n'êtes pas connecté.`);
  });

  it("should forbid user authenticated with a token tied to a government account when IPs do not match", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
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
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });

    const res = await request
      .post("/")
      .send({
        query: `{formPdf(id: "${bsdd.id}") {token}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", userIP); // IPs do not match
    const { errors, data } = res.body;
    expect(data).toBeNull();
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(`Vous n'êtes pas connecté.`);
  });
});
