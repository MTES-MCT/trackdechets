import { resetDatabase } from "../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../__tests__/factories";
import { CompanyDigestStatus } from "@prisma/client";
import supertest from "supertest";
import { app } from "../../server";
import { prisma } from "@td/prisma";
import { companyDigestFactory } from "../../companydigest/__tests__/factories.companydigest";

const { GERICO_WEBHOOK_TOKEN, GERICO_WEBHOOK_SLUG } = process.env;

const request = supertest(app);

describe("Gerico Router", () => {
  afterEach(resetDatabase);

  it("should fail if no auth header is provided ", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");

    await companyDigestFactory({
      opt: { orgId: company.siret!, distantId: "abcd" }
    });

    const url = `/${GERICO_WEBHOOK_SLUG}`;

    const res = await request
      .post(url)
      .set("Accept", "application/json")
      .send({ distantId: "abcd", status: "PROCESSED" });

    expect(res.status).toEqual(403); // forbidden
  });

  it("should fail if auth header is malformed ", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");

    await companyDigestFactory({
      opt: { orgId: company.siret!, distantId: "abcd" }
    });

    const url = `/${GERICO_WEBHOOK_SLUG}`;

    const res = await request
      .post(url)
      .set("Accept", "application/json")
      .set("Authorization", "Lorem")
      .send({ distantId: "abcd", status: "PROCESSED" });

    expect(res.status).toEqual(403); // forbidden
  });

  it("should fail if auth token is not valid ", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");

    await companyDigestFactory({
      opt: { orgId: company.siret!, distantId: "abcd" }
    });

    const url = `/${GERICO_WEBHOOK_SLUG}`;

    const res = await request
      .post(url)
      .set("Accept", "application/json")
      .set("Authorization", "Token lorem")
      .send({ distantId: "abcd", status: "PROCESSED" });

    expect(res.status).toEqual(403); // forbidden
  });

  it("should fail if  company digest does not exist", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");

    await companyDigestFactory({
      opt: { orgId: company.siret!, distantId: "abcd" }
    });

    const url = `/${GERICO_WEBHOOK_SLUG}`;

    const res = await request
      .post(url)
      .set("Accept", "application/json")
      .set("Authorization", `Token ${GERICO_WEBHOOK_TOKEN}`)
      .send({ distantId: "random", status: "PROCESSED" });

    expect(res.status).toEqual(404); // does not exist
  });

  it.each([CompanyDigestStatus.PROCESSED, CompanyDigestStatus.ERROR])(
    "should fail if company digest state is %p",
    async state => {
      const { company } = await userWithCompanyFactory("MEMBER");

      await companyDigestFactory({
        opt: { orgId: company.siret!, distantId: "abcd", state }
      });

      const url = `/${GERICO_WEBHOOK_SLUG}`;

      const res = await request
        .post(url)
        .set("Accept", "application/json")
        .set("Authorization", `Token ${GERICO_WEBHOOK_TOKEN}`)
        .send({ distantId: "abcd", status: "PROCESSED" });

      expect(res.status).toEqual(404);
    }
  );
  it("should udpate company digest status", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");

    const cd = await companyDigestFactory({
      opt: { orgId: company.siret!, distantId: "abcd" }
    });

    const url = `/${GERICO_WEBHOOK_SLUG}`;

    const res = await request
      .post(url)
      .set("Accept", "application/json")
      .set("Authorization", `Token ${GERICO_WEBHOOK_TOKEN}`)
      .send({ distantId: "abcd", status: "PROCESSED" });

    expect(res.status).toEqual(200);

    const updated = await prisma.companyDigest.findUnique({
      where: { id: cd.id }
    });

    expect(updated?.state).toEqual("PROCESSED");
  });
});
