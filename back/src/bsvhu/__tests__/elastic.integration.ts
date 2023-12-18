import { resetDatabase } from "../../../integration-tests/helper";
import {
  UserWithCompany,
  userWithCompanyFactory
} from "../../__tests__/factories";
import { BsdElastic } from "../../common/elastic";
import { getWhere, toBsdElastic } from "../elastic";
import { bsvhuFactory } from "./factories.vhu";

describe("getWhere", () => {
  test("if emitter publishes VHU > transporter should see it in 'follow' tab", async () => {
    // Given
    const bsvhu = await bsvhuFactory({});
    const transporterSiret = bsvhu.transporterCompanySiret;

    // When
    const where = getWhere(bsvhu);

    // Then
    expect(where.isFollowFor).toContain(transporterSiret);
    expect(where.isToCollectFor).not.toContain(transporterSiret); // regression test
  });
});

describe("toBsdElastic > companies Names & Sirets", () => {
  afterEach(resetDatabase);

  let emitter: UserWithCompany;
  let transporter: UserWithCompany;
  let destination: UserWithCompany;
  let bsvhu: any;
  let elasticBsvhu: BsdElastic;

  beforeAll(async () => {
    // Given
    emitter = await userWithCompanyFactory("ADMIN", { name: "Emitter" });
    transporter = await userWithCompanyFactory("ADMIN", {
      name: "Transporter"
    });
    destination = await userWithCompanyFactory("ADMIN", {
      name: "Destination"
    });

    bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanyName: emitter.company.name,
        emitterCompanySiret: emitter.company.siret,
        transporterCompanyName: transporter.company.name,
        transporterCompanySiret: transporter.company.siret,
        destinationCompanyName: destination.company.name,
        destinationCompanySiret: destination.company.siret
      }
    });

    // When
    elasticBsvhu = toBsdElastic(bsvhu);
  });

  test("companiesNames > should contain the names of ALL BSVHU companies", async () => {
    // Then
    expect(elasticBsvhu.companiesNames).toContain(emitter.company.name);
    expect(elasticBsvhu.companiesNames).toContain(transporter.company.name);
    expect(elasticBsvhu.companiesNames).toContain(destination.company.name);
  });

  test("companiesSirets > should contain the sirets of ALL BSVHU companies", async () => {
    // Then
    expect(elasticBsvhu.companiesSirets).toContain(emitter.company.siret);
    expect(elasticBsvhu.companiesSirets).toContain(transporter.company.siret);
    expect(elasticBsvhu.companiesSirets).toContain(destination.company.siret);
  });
});
