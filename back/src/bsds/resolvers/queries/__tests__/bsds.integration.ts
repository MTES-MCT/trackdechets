import { GovernmentPermission } from "@td/prisma";
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

describe("query bsds: governement accounts permissions", () => {
  afterEach(resetDatabase);

  it("should forbid user authenticated with a token when tied to a government account with relevant perms", async () => {
    // query bsds used t be opend to gov account but is forbidden now
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
    const {
      body: { errors, data }
    } = await request
      .post("/")
      .send({
        query: `{ bsds(where: {isFollowFor: ["${someCompany.siret}"]}) {pageInfo: totalCount}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);

    expect(data).toBeNull();
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(`Vous n'êtes pas connecté.`);
  });
});
