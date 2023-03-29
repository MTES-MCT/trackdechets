import { resetDatabase } from "./../../../integration-tests/helper";
import {
  companyFactory,
  userWithCompanyFactory
} from "../../__tests__/factories";

import { bsdaFactory } from "./factories";

describe("Bsda factories", () => {
  afterEach(resetDatabase);

  it("should denormalize intermediaries sirets", async () => {
    const otherCompany = await companyFactory();
    const { company } = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: otherCompany.siret,
        intermediaries: {
          create: [
            { siret: company.siret!, name: company.name, contact: "joe" }
          ]
        }
      }
    });

    expect(bsda.intermediariesOrgIds).toEqual([company.siret]);
  });
});
