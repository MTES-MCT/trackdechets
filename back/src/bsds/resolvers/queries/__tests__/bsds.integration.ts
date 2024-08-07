import { GovernmentPermission } from "@prisma/client";
import {
  refreshElasticSearch,
  resetDatabase
} from "../../../../../integration-tests/helper";
import supertest from "supertest";

import { app } from "../../../../server";
import {
  formFactory,
  userWithCompanyFactory,
  userWithAccessTokenFactory
} from "../../../../__tests__/factories";

import { getFormForElastic, indexForm } from "../../../../forms/elastic";

import { faker } from "@faker-js/faker";

describe("query bsds: governement accoutns permissions", () => {
  afterEach(resetDatabase);

  it("should allow user authenticated with a token when tied to a government account with relevant perms", async () => {
    const { user: owner, company: someCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const request = supertest(app);

    const allowedIP = faker.internet.ipv4();
    // the gov account running the query
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
    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        emitterCompanySiret: someCompany.siret,
        status: "SENT",
        sentAt: new Date(),
        receivedAt: new Date()
      }
    });
    await indexForm(await getFormForElastic(form));
    await refreshElasticSearch();
    const res = await request
      .post("/")
      .send({
        query: `{ bsds(where: {isFollowFor: ["${someCompany.siret}"]}) {pageInfo: totalCount}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);
    const { errors, data } = res.body;

    expect(errors).toBeUndefined();
    expect(data.bsds.pageInfo).toEqual(1);
  });

  it("should forbid user authenticated with a token when tied to a government account without relevant perms", async () => {
    const { user: owner, company: someCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const request = supertest(app);

    const allowedIP = faker.internet.ipv4();
    // the gov account running the query
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
    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        emitterCompanySiret: someCompany.siret,
        status: "SENT",
        sentAt: new Date(),
        receivedAt: new Date()
      }
    });
    await indexForm(await getFormForElastic(form));
    await refreshElasticSearch();
    const res = await request
      .post("/")
      .send({
        query: `{ bsds(where: {isFollowFor: ["${someCompany.siret}"]}) {pageInfo: totalCount}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);
    const { errors, data } = res.body;
    expect(data).toBeNull();
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(`Vous n'êtes pas connecté.`);
  });

  it("should forbid user authenticated with a token if no gov government is associated", async () => {
    // the company and owner to build a registry
    const { user: owner, company: someCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const request = supertest(app);

    const allowedIP = faker.internet.ipv4();
    // the gov account running the query
    const { accessToken } = await userWithAccessTokenFactory();
    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        emitterCompanySiret: someCompany.siret,
        status: "SENT",
        sentAt: new Date(),
        receivedAt: new Date()
      }
    });
    await indexForm(await getFormForElastic(form));
    await refreshElasticSearch();
    const res = await request
      .post("/")
      .send({
        query: `{ bsds(where: {isFollowFor: ["${someCompany.siret}"]}) {pageInfo: totalCount}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);
    const { errors, data } = res.body;
    expect(data).toBeNull();
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(`Vous n'êtes pas connecté.`);
  });

  it("should forbid user authenticated with a token tied to a government account when IPs do not match", async () => {
    const { user: owner, company: someCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
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
    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        emitterCompanySiret: someCompany.siret,
        status: "SENT",
        sentAt: new Date(),
        receivedAt: new Date()
      }
    });
    await indexForm(await getFormForElastic(form));
    await refreshElasticSearch();
    const res = await request
      .post("/")
      .send({
        query: `{ bsds(where: {isFollowFor: ["${someCompany.siret}"]}) {pageInfo: totalCount}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", userIP); // IPs do not match
    const { errors, data } = res.body;
    expect(data).toBeNull();
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(`Vous n'êtes pas connecté.`);
  });
});
