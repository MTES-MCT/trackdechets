import { gql } from "graphql-tag";
import supertest from "supertest";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { logIn } from "../../../../__tests__/auth.helper";
import {
  adminFactory,
  userFactory,
  userWithAccessTokenFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { AuthType } from "../../../../auth/auth";
import { app, sess } from "../../../../server";
import { getUIBaseURL } from "../../../../utils";

const request = supertest(app);
const cookieRegExp = new RegExp(
  `${sess.name}=(.+); Domain=${
    sess.cookie!.domain
  }; Path=/; Expires=.+; HttpOnly`
);

jest.mock("../../../../utils", () => {
  const originalModule = jest.requireActual("../../../../utils");

  return {
    __esModule: true,
    ...originalModule,
    getUIBaseURL: () => "*"
  };
});

const ANONYMIZE_MUTATION = gql`
  mutation AnonymizeUser($id: ID!) {
    anonymizeUser(id: $id)
  }
`;

describe("disconnectDeletedUser Middleware", () => {
  afterAll(async () => {
    await resetDatabase();
  });

  it("must not disconnect a user when not admin", async () => {
    const user = await userFactory();
    const user2 = await userFactory();
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate(ANONYMIZE_MUTATION, {
      variables: { id: user2.id }
    });

    expect(errors.length).toBe(1);
    expect(errors[0]).toMatchObject({
      extensions: {
        code: "FORBIDDEN"
      }
    });
  });

  it("should disconnect a user with a cookie", async () => {
    const user = await userFactory();
    const admin = await adminFactory();

    const { mutate } = makeClient({ ...admin, auth: AuthType.Session });

    const { sessionCookie } = await logIn(app, user.email, "pass");
    const cookieValue = sessionCookie.match(cookieRegExp)![1];

    // should be logged-in
    const res = await request
      .post("/")
      .send({ query: "{ me { email } }" })
      .set("Cookie", `${sess.name}=${cookieValue}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      me: { email: user.email }
    });

    const { data } = await mutate(ANONYMIZE_MUTATION, {
      variables: { id: user.id }
    });

    expect(data.anonymizeUser).toContain("-anonymous@trackdechets.fr");
    // should be logged-out
    const rejected = await request
      .post("/")
      .send({ query: "{ me { email } }" })
      .set("Cookie", `${sess.name}=${cookieValue}`);

    expect(rejected.status).toBe(302);
    expect(rejected.headers["location"]).toBe(getUIBaseURL());
  });

  it("must not disconnect a user when associated with a company with only one admin", async () => {
    const { user } = await userWithCompanyFactory("ADMIN");
    const admin = await adminFactory();

    const { mutate } = makeClient({ ...admin, auth: AuthType.Session });

    const { sessionCookie } = await logIn(app, user.email, "pass");
    const cookieValue = sessionCookie.match(cookieRegExp)![1];

    // should be logged-in
    const res = await request
      .post("/")
      .send({ query: "{ me { email } }" })
      .set("Cookie", `${sess.name}=${cookieValue}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      me: { email: user.email }
    });

    const { errors } = await mutate(ANONYMIZE_MUTATION, {
      variables: { id: user.id }
    });

    expect(errors.length).toBe(1);
    expect(errors[0]).toMatchObject({
      extensions: {
        code: "BAD_USER_INPUT"
      }
    });
    expect(errors[0].message).toMatch(
      "Impossible de supprimer cet utilisateur car il est le seul administrateur de l'entreprise"
    );
  });

  it("should disconnect api user with a bearer token", async () => {
    const { user, accessToken } = await userWithAccessTokenFactory();
    const admin = await adminFactory();

    const { mutate } = makeClient({ ...admin, auth: AuthType.Session });
    const res = await request
      .post("/")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query: "{ me { email }}" });

    expect(res.body.data.me.email).toEqual(user.email);
    const { data } = await mutate(ANONYMIZE_MUTATION, {
      variables: { id: user.id }
    });

    expect(data.anonymizeUser).toContain("-anonymous@trackdechets.fr");
    const rejected = await request
      .post("/")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query: "{ me { email }}" });

    expect(rejected.status).toEqual(200);
    expect(rejected.body.errors[0]).toMatchObject({
      message: "Vous n'êtes pas connecté."
    });
  });
});
