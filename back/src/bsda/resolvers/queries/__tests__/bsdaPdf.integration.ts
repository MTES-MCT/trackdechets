import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  companyFactory,
  userWithCompanyFactory,
  userWithAccessTokenFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { ErrorCode } from "../../../../common/errors";
import { bsdaFactory } from "../../../__tests__/factories";
import type { Query } from "@td/codegen-back";
import { GovernmentPermission } from "@td/prisma";
import supertest from "supertest";
import { faker } from "@faker-js/faker";
import { app } from "../../../../server";
import { gql } from "graphql-tag";

const BSDA_PDF = gql`
  query BsdaPdf($id: ID!) {
    bsdaPdf(id: $id) {
      token
    }
  }
`;

describe("Query.BsdaPdf", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { query } = makeClient();
    const bsda = await bsdaFactory({
      opt: {}
    });

    const { errors } = await query<Pick<Query, "bsdaPdf">>(BSDA_PDF, {
      variables: { id: bsda.id }
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

  it("should forbid access to user not on the bsd (simple bsda)", async () => {
    const bsda = await bsdaFactory({
      opt: {}
    });
    const { user } = await userWithCompanyFactory("MEMBER");

    const { query } = makeClient(user);
    const { errors } = await query<Pick<Query, "bsdaPdf">>(BSDA_PDF, {
      variables: { id: bsda.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous n'êtes pas autorisé à accéder au récépissé PDF de ce BSDA.",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should return a token for requested id", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsdaPdf">>(BSDA_PDF, {
      variables: { id: bsda.id }
    });

    expect(data.bsdaPdf.token).toBeTruthy();
  });

  it("should return a token for requested id if current user is not on the bsda but on a parent bsda", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const forwardingBsda = await bsdaFactory({
      opt: {
        forwarding: { connect: { id: bsda.id } }
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsdaPdf">>(BSDA_PDF, {
      variables: { id: forwardingBsda.id }
    });

    expect(data.bsdaPdf.token).toBeTruthy();
  });

  it("should return a token for requested id if current user is an intermediary", async () => {
    const otherCompany = await companyFactory();
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: otherCompany.siret,
        intermediaries: {
          create: [
            { siret: company.siret!, name: company.name, contact: "joe" }
          ]
        }
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsdaPdf">>(BSDA_PDF, {
      variables: { id: bsda.id }
    });

    expect(data.bsdaPdf.token).toBeTruthy();
  });

  it("should allow pdf access to user authenticated with a token when tied to a government account with relevant perms", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
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
        query: `{bsdaPdf(id: "${bsda.id}") {token}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);
    const { errors, data } = res.body;

    expect(errors).toBeUndefined();
    expect(data.bsdaPdf.token).toBeTruthy();
  });
  it("should forbid pdf access to user authenticated with a token when tied to a government account without relevant perms", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
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
        query: `{bsdaPdf(id: "${bsda.id}") {token}}`
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
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const res = await request
      .post("/")
      .send({
        query: `{bsdaPdf(id: "${bsda.id}") {token}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", userIP); // IPs do not match
    const { errors, data } = res.body;
    expect(data).toBeNull();
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(`Vous n'êtes pas connecté.`);
  });
});
