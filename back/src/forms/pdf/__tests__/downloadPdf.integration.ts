import supertest from "supertest";
import { app } from "../../../server";
import {
  formFactory,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import { resetDatabase } from "../../../../integration-tests/helper";
import prisma from "src/prisma";

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
    const { token } = await prisma.accessToken.create({
      data: {
        user: { connect: { id: user.id } },
        token: "token"
      }
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });
    const formPdfResponse = await request
      .post("/")
      .set("Authorization", `Bearer ${token}`)
      .send({ query: formPdfQuery(form.id) });
    const downloadToken = formPdfResponse.body.data.formPdf.token;
    const res = await request.get(`/download?token=${downloadToken}`);
    expect(res.status).toBe(200);
    expect(res.header["content-type"]).toBe("application/pdf");
    const date = new Date();
    const fileNameSuffix = `${date.getDate()}-${
      date.getMonth() + 1
    }-${date.getFullYear()}`;

    expect(res.header["content-disposition"]).toBe(
      `attachment;filename=BSD_${form.readableId}_${fileNameSuffix}.pdf`
    );
  });
});
