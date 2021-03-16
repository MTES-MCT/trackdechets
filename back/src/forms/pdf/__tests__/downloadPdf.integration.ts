import supertest from "supertest";
import { app } from "../../../server";
import {
  formFactory,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import { resetDatabase } from "../../../../integration-tests/helper";
import prisma from "../../../prisma";
import { hashToken } from "../../../utils";

const request = supertest(app);

const formPdfQuery = (formId: string) => `
query {
  formPdf(id: "${formId}"){
    token
  }
}
`;

describe("downloadPdf", () => {
  afterAll(resetDatabase);
  it("should download a pdf", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const clearToken = "token";
    await prisma.accessToken.create({
      data: {
        user: { connect: { id: user.id } },
        token: hashToken(clearToken)
      }
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });
    const formPdfResponse = await request
      .post("/")
      .set("Authorization", `Bearer ${clearToken}`)
      .send({ query: formPdfQuery(form.id) });

    const downloadToken = formPdfResponse.body.data.formPdf.token;
    const res = await request.get(`/download?token=${downloadToken}`);
    expect(res.status).toBe(200);
    expect(res.header["content-type"]).toBe("application/pdf");
    expect(res.header["content-disposition"]).toBe(
      `attachment;filename=${form.readableId}.pdf`
    );
  }, 10000);
});
