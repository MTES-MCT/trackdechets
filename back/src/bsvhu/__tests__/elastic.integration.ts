import { Company } from "@prisma/client";
import { resetDatabase } from "../../../integration-tests/helper";
import { companyFactory } from "../../__tests__/factories";
import { BsdElastic } from "../../common/elastic";
import { getWhere, toBsdElastic } from "../elastic";
import { bsvhuFactory, toIntermediaryCompany } from "./factories.vhu";

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
  let intermediary1: Company;
  let intermediary2: Company;
  let ecoOrganisme: Company;

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
    intermediary1 = await companyFactory({ name: "Intermediaire 1" });
    intermediary2 = await companyFactory({ name: "Intermediaire 2" });
    ecoOrganisme = await companyFactory({ name: "Eco organisme" });

    bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanyName: emitter.name,
        emitterCompanySiret: emitter.siret,
        transporterCompanyName: transporter.name,
        transporterCompanySiret: transporter.siret,
        transporterCompanyVatNumber: transporter.vatNumber,
        destinationCompanyName: destination.name,
        destinationCompanySiret: destination.siret,
        ecoOrganismeName: ecoOrganisme.name,
        ecoOrganismeSiret: ecoOrganisme.siret,
        intermediaries: {
          createMany: {
            data: [
              toIntermediaryCompany(intermediary1),
              toIntermediaryCompany(intermediary2)
            ]
          }
        }
      }
    });

    // When
    elasticBsvhu = toBsdElastic(bsvhu);
  });

  test("companyNames > should contain the names of ALL BSVHU companies", async () => {
    // Then
    expect(elasticBsvhu.companyNames).toContain(emitter.name);
    expect(elasticBsvhu.companyNames).toContain(transporter.name);
    expect(elasticBsvhu.companyNames).toContain(destination.name);
    expect(elasticBsvhu.companyNames).toContain(intermediary1.name);
    expect(elasticBsvhu.companyNames).toContain(intermediary2.name);
    expect(elasticBsvhu.companyNames).toContain(ecoOrganisme.name);
  });

  test("companyOrgIds > should contain the orgIds of ALL BSVHU companies", async () => {
    // Then
    expect(elasticBsvhu.companyOrgIds).toContain(emitter.siret);
    expect(elasticBsvhu.companyOrgIds).toContain(transporter.vatNumber);
    expect(elasticBsvhu.companyOrgIds).toContain(destination.siret);
    expect(elasticBsvhu.companyOrgIds).toContain(intermediary1.siret);
    expect(elasticBsvhu.companyOrgIds).toContain(intermediary2.siret);
    expect(elasticBsvhu.companyOrgIds).toContain(ecoOrganisme.siret);
  });
});
