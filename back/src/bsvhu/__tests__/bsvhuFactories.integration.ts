import { resetDatabase } from "./../../../integration-tests/helper";
import {
  companyFactory,
  userWithCompanyFactory
} from "../../__tests__/factories";
import { bsvhuFactory, toIntermediaryCompany } from "./factories.vhu";

describe("Bsvhu factories", () => {
  afterEach(resetDatabase);

  it("should denormalize intermediaries sirets", async () => {
    const otherCompany = await companyFactory();
    const { company } = await userWithCompanyFactory("MEMBER");
    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: otherCompany.siret,
        intermediaries: {
          create: [toIntermediaryCompany(company)]
        }
      }
    });

    expect(bsvhu.intermediariesOrgIds).toEqual([company.siret]);
  });
});
