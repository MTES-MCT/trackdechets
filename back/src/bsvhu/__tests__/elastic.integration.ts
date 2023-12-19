import { Company } from "@prisma/client";
import { resetDatabase } from "../../../integration-tests/helper";
import { companyFactory } from "../../__tests__/factories";
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

describe("toBsdElastic > companies Names & OrgIds", () => {
  afterEach(resetDatabase);

  let emitter: Company;
  let transporter: Company;
  let destination: Company;
  let bsvhu: any;
  let elasticBsvhu: BsdElastic;

  beforeAll(async () => {
    // Given
    emitter = await companyFactory({ name: "Emitter" });
    transporter = await companyFactory({
      name: "Transporter",
      vatNumber: "VAT Transporter"
    });
    destination = await companyFactory({
      name: "Destination"
    });

    bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanyName: emitter.name,
        emitterCompanySiret: emitter.siret,
        transporterCompanyName: transporter.name,
        transporterCompanySiret: transporter.siret,
        transporterCompanyVatNumber: transporter.vatNumber,
        destinationCompanyName: destination.name,
        destinationCompanySiret: destination.siret
      }
    });

    // When
    elasticBsvhu = toBsdElastic(bsvhu);
  });

  test("companiesNames > should contain the names of ALL BSVHU companies", async () => {
    // Then
    expect(elasticBsvhu.companiesNames).toContain(emitter.name);
    expect(elasticBsvhu.companiesNames).toContain(transporter.name);
    expect(elasticBsvhu.companiesNames).toContain(destination.name);
  });

  test("companiesOrgIds > should contain the orgIds of ALL BSVHU companies", async () => {
    // Then
    expect(elasticBsvhu.companiesOrgIds).toContain(emitter.siret);
    expect(elasticBsvhu.companiesOrgIds).toContain(transporter.siret);
    expect(elasticBsvhu.companiesOrgIds).toContain(transporter.vatNumber);
    expect(elasticBsvhu.companiesOrgIds).toContain(destination.siret);
  });
});
