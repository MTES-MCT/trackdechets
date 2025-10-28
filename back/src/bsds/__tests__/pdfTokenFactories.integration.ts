import { resetDatabase } from "../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../__tests__/factories";
import { pdfAccessTokenFactory } from "./factories";
import { bsdasriFactory } from "../../bsdasris/__tests__/factories";
import { BsdType } from "@td/prisma";

describe("Mutation.creatPdfAccessToken", () => {
  afterEach(resetDatabase);
  it("should create a pdf access token", async () => {
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

    expect(token.token.length).toEqual(50);
  });
});
