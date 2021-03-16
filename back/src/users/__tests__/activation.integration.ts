import { resetDatabase } from "../../../integration-tests/helper";
import prisma from "../../prisma";

import { userFactory } from "../../__tests__/factories";

import { createActivationHash } from "../resolvers/mutations/signup";

import supertest from "supertest";

import { app } from "../../server";
const request = supertest(app);

describe("user activation", () => {
  afterEach(resetDatabase);

  it("should activate an user", async () => {
    const user = await userFactory({
      email: "bruce.banner@trackdechets.fr",
      isActive: false
    });

    const userActivationHash = await createActivationHash(user);
    await request.get(`/userActivation?hash=${userActivationHash.hash}`);

    const refreshedUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    expect(refreshedUser.isActive).toEqual(true);
    expect(refreshedUser.activatedAt).toBeTruthy();
  });
});
