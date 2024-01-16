import { resetDatabase } from "../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../__tests__/factories";
import { pdfAccessTokenFactory } from "../../bsds/__tests__/factories";
import { bsdasriFactory } from "../../bsdasris/__tests__/factories";
import { BsdType } from "@prisma/client";
import supertest from "supertest";
import { app } from "../../server";
import { ROAD_CONTROL_SLUG } from "@td/constants";
import { prisma } from "@td/prisma";

const { API_HOST } = process.env;

const request = supertest(app);

describe("Road control pdf Router", () => {
  afterEach(resetDatabase);

  it("should redirect to pdf download url", async () => {
    const { company, user } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const token = await pdfAccessTokenFactory({
      bsd: dasri,
      user,
      bsdType: BsdType.BSDASRI
    });
    const url = `/${ROAD_CONTROL_SLUG}/${token.token}`;

    const res = await request.get(url);

    expect(res.status).toEqual(302);
    expect(
      res.header.location.startsWith(`http://${API_HOST}/download?token=`)
    ).toBe(true);

    const tkn = await prisma.pdfAccessToken.findUniqueOrThrow({
      where: {
        id: token.id
      }
    });
    expect(tkn.visitedAt).toBeTruthy();
  });

  it("should display an error message if token is expired", async () => {
    const { company, user } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const token = await pdfAccessTokenFactory({
      bsd: dasri,
      user,
      bsdType: BsdType.BSDASRI
    });

    await prisma.pdfAccessToken.update({
      where: { id: token.id },
      data: { expiresAt: new Date() }
    });
    const url = `/${ROAD_CONTROL_SLUG}/${token.token}`;

    const res = await request.get(url);

    expect(res.text).toEqual(
      "Vous n'êtes pas autorisé à accéder à ce bordereau."
    );
  });

  it("should display an error message if token does not exist", async () => {
    const url = `/${ROAD_CONTROL_SLUG}/abcdf`;

    const res = await request.get(url);

    expect(res.text).toEqual(
      "Vous n'êtes pas autorisé à accéder à ce bordereau."
    );
  });
});
