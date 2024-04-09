import request from "supertest";
import { app } from "../../server";
import { userFactory } from "../../__tests__/factories";
import { logIn } from "../../__tests__/auth.helper";
import { resetDatabase } from "../../../integration-tests/helper";

describe("Auth Router", () => {
  afterEach(resetDatabase);

  describe("POST /impersonate", () => {
    it("should return 404 if user is logged in", async () => {
      const user = await userFactory();
      const { sessionCookie } = await logIn(app, user.email, "pass");

      const response = await request(app)
        .post("/impersonate")
        .set("Cookie", sessionCookie)
        .set("Content-Type", "application/json")
        .send({ email: "admin@example.com" });

      expect(response.status).toBe(404);
    });

    it("should return 404 if user is not admin", async () => {
      const user = await userFactory();
      const { sessionCookie } = await logIn(app, user.email, "pass");

      const response = await request(app)
        .post("/impersonate")
        .set("Cookie", sessionCookie)
        .set("Content-Type", "application/json")
        .send({ email: "admin@example.com" });

      expect(response.status).toBe(404);
    });

    it("should return 400 if user is admin and impersonated user is not found", async () => {
      const user = await userFactory({ isAdmin: true });
      const { sessionCookie } = await logIn(app, user.email, "pass");

      const response = await request(app)
        .post("/impersonate")
        .set("Cookie", sessionCookie)
        .set("Content-Type", "application/json")
        .send({ email: "admin@example.com" });

      expect(response.status).toBe(400);
      expect(response.text).toBe("Unknown email");
    });

    it("should redirect if user is admin and user is found", async () => {
      const impersonatedUser = await userFactory();

      const user = await userFactory({ isAdmin: true });
      const { sessionCookie } = await logIn(app, user.email, "pass");

      const response = await request(app)
        .post("/impersonate")
        .set("Cookie", sessionCookie)
        .set("Content-Type", "application/json")
        .send({ email: impersonatedUser.email });

      expect(response.status).toBe(302);
    });
  });
});
