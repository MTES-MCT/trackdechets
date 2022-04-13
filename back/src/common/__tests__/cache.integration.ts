import prisma from "../../prisma";
import { resetDatabase } from "../../../integration-tests/helper";
import {
  companyFactory,
  userWithCompanyFactory
} from "../../__tests__/factories";

import {
  getCachedUserSirets,
  getUserCompanySiretCacheKey,
  deleteCachedUserCompanies
} from "../../common/redis/users";
import { redisClient } from "../redis";

describe("Test Caching", () => {
  afterAll(async () => {
    await resetDatabase();
  });

  test("siret caching lifecycle", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const otherCompany = await companyFactory();

    await prisma.companyAssociation.create({
      data: {
        user: { connect: { id: user.id } },
        company: { connect: { id: otherCompany.id } },
        role: "MEMBER"
      }
    });

    const key = getUserCompanySiretCacheKey(user.id);
    // redis key does not exist yet
    let exists = await redisClient.exists(key);
    expect(exists).toBe(0);

    const sirets = await getCachedUserSirets(user.id);

    expect(sirets.length).toEqual(2);
    expect(sirets.includes(company.siret)).toBe(true);
    expect(sirets.includes(otherCompany.siret)).toBe(true);

    // redis key exists now
    exists = await redisClient.exists(key);
    expect(exists).toBe(1);

    await deleteCachedUserCompanies(user.id);
    // redis key is gone
    exists = await redisClient.exists(key);
    expect(exists).toBe(0);
  });
});
