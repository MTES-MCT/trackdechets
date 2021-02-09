import { resetDatabase } from "../../../../integration-tests/helper";
import prisma from "../../../prisma";
import {
  userWithAccessTokenFactory,
  userFactory
} from "../../../__tests__/factories";
import { getUid, hashToken } from "../../../utils";
import { hashTokens } from "../hash-tokens";

describe("hashTokens", () => {
  afterAll(async () => {
    await resetDatabase();
  });

  it("should update existing unhashed tokens and preserve hashed ones", async () => {
    // generate a hashed token
    const { accessToken: hashedToken } = await userWithAccessTokenFactory();

    // generate a unhashed token, as they were created before the hashing implementation
    const user = await userFactory();
    const unHashedToken = await prisma.accessToken.create({
      data: {
        token: getUid(40),
        user: { connect: { id: user.id } }
      }
    });

    // run the migration function
    await hashTokens();
    // let's retrieve the previously unhashed token by its hashed value
    await prisma.accessToken.findUnique({
      where: { token: hashToken(unHashedToken.token) }
    });
    // let's retrieve the hashed token who shouldn't have been updated
    await prisma.accessToken.findUnique({ where: { token: hashedToken } });
  });
});
