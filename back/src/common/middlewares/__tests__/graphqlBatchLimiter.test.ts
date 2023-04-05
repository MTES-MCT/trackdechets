import express, { json } from "express";
import supertest from "supertest";
import { graphqlBatchLimiterMiddleware } from "../graphqlBatchLimiter";

const graphQLPath = "/gql";

describe("graphqlBatchLimiterMiddleware", () => {
  const app = express();
  app.use(json());
  app.use(graphQLPath, graphqlBatchLimiterMiddleware());
  app.post(graphQLPath, (req, res) => {
    res.status(200).send(req.body);
  });
  const request = supertest(app);

  it("should allow object requests", async () => {
    const body = JSON.stringify({ foo: "bar" });
    const response = await request
      .post(graphQLPath)
      .set("Content-Type", "application/json")
      .send(body);
    expect(response.status).toEqual(200);
  });

  it("should allow array requests that respect the batch limit", async () => {
    const body = JSON.stringify([{ foo: "bar" }]);
    const response = await request
      .post(graphQLPath)
      .set("Content-Type", "application/json")
      .send(body);
    expect(response.status).toEqual(200);
  });

  it("should fail if batching has too many operations", async () => {
    const body = JSON.stringify([...Array(10)].map(_ => ({ foo: "bar" })));
    const response = await request
      .post(graphQLPath)
      .set("Content-Type", "application/json")
      .send(body);
    expect(response.status).toEqual(400);
    expect(response.text).toContain(
      "Batching is limited to 5 operations per request."
    );
  });

  it("should allow query batching that respect the batch limit", async () => {
    const body = JSON.stringify({
      operationName: null,
      variables: {},
      query:
        "{\n" +
        '  _34035399400023: companyInfos(siret: "34035399400023") {\n' +
        "    allowBsdasriTakeOverWithoutSignature\n" +
        "  }\n" +
        '  _20002305900112: companyInfos(siret: "20002305900112") {\n' +
        "    allowBsdasriTakeOverWithoutSignature\n" +
        "  }\n" +
        '  _26030017300010: companyInfos(siret: "26030017300010") {\n' +
        "    allowBsdasriTakeOverWithoutSignature\n" +
        "  }\n" +
        '  _53063610900429: companyInfos(siret: "53063610900429") {\n' +
        "    allowBsdasriTakeOverWithoutSignature\n" +
        "  }\n" +
        '  _18008901307630: companyInfos(siret: "18008901307630") {\n' +
        "    allowBsdasriTakeOverWithoutSignature\n" +
        "  }\n" +
        "}\n"
    });

    const response = await request
      .post(graphQLPath)
      .set("Content-Type", "application/json")
      .send(body);
    expect(response.status).toEqual(200);
  });

  it("should fail if query batching has too many operations", async () => {
    const body = JSON.stringify({
      operationName: null,
      variables: {},
      query:
        "{\n" +
        '  _34035399400023: companyInfos(siret: "34035399400023") {\n' +
        "    allowBsdasriTakeOverWithoutSignature\n" +
        "  }\n" +
        '  _20002305900112: companyInfos(siret: "20002305900112") {\n' +
        "    allowBsdasriTakeOverWithoutSignature\n" +
        "  }\n" +
        '  _26030017300010: companyInfos(siret: "26030017300010") {\n' +
        "    allowBsdasriTakeOverWithoutSignature\n" +
        "  }\n" +
        '  _53063610900429: companyInfos(siret: "53063610900429") {\n' +
        "    allowBsdasriTakeOverWithoutSignature\n" +
        "  }\n" +
        '  _18008901307630: companyInfos(siret: "18008901307630") {\n' +
        "    allowBsdasriTakeOverWithoutSignature\n" +
        "  }\n" +
        '  _82944026200014: companyInfos(siret: "82944026200014") {\n' +
        "    allowBsdasriTakeOverWithoutSignature\n" +
        "  }\n" +
        "}\n"
    });

    const response = await request
      .post(graphQLPath)
      .set("Content-Type", "application/json")
      .send(body);
    expect(response.status).toEqual(400);
    const { error } = JSON.parse(response.text) as any;
    expect(error).toContain(
      "Batching by query merging is limited to 5 operations per query."
    );
  });
});
