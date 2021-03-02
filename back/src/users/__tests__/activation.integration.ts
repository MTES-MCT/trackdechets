import { resetDatabase } from "../../../integration-tests/helper";
import prisma from "../../prisma";

import { userFactory } from "../../__tests__/factories";

import { createActivationHash } from "../resolvers/mutations/signup";

import supertest from "supertest";

import { app } from "../../server";
const request = supertest(app);
describe("createUserAccountHash", () => {
  afterEach(resetDatabase);
  it("should return user account hash", async () => {
    const user = await userFactory({
      email: "bruce.banner@trackdechets.fr",
      isActive: false
    });

    const userActivationHash = await createActivationHash(user);
    const activate = await request.get(
      `/userActivation?hash=${userActivationHash.hash}`
    );

    const refreshedUser = await prisma.user.findUnique({ where :  { id: user.id }});

    expect(refreshedUser.isActive).toEqual(true);
    expect(refreshedUser.activatedAt).toBeTruthy();
  });
});
