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
      email: "clark.kent@trackdechets.fr",
      isActive: false
    });

    const userActivationHash = await createActivationHash(user);
    await request
      .post(`/userActivation`)
      .send({ hash: userActivationHash.hash });

    const refreshedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });

    expect(refreshedUser.isActive).toEqual(true);
    expect(refreshedUser.activatedAt).toBeTruthy();

    const refreshedHash = await prisma.userActivationHash.findFirst({
      where: { hash: userActivationHash.hash }
    });

    expect(refreshedHash).toBe(null);
  });

  it("should fail when hash does not exist", async () => {
    const user = await userFactory({
      email: "bruce.banner@trackdechets.fr",
      isActive: false
    });

    const userActivationHash = await createActivationHash(user);
    const hash = userActivationHash.hash;
    await prisma.userActivationHash.delete({
      where: {
        id: userActivationHash.id
      }
    });

    await request.post(`/userActivation`).send({ hash });

    const refreshedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });

    expect(refreshedUser.isActive).toEqual(false);
    expect(refreshedUser.activatedAt).toBeFalsy();
  });
});
