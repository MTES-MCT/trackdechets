import { resetDatabase } from "../../../integration-tests/helper";
import { companyFactory } from "../../__tests__/factories";
import { getBsdasriForElastic, toBsdElastic } from "../elastic";
import { BsdElastic } from "../../common/elastic";
import { bsdasriFactory } from "./factories";
import { Company } from "@prisma/client";

describe("toBsdElastic > companies Names & Sirets", () => {
  afterEach(resetDatabase);

  let emitter: Company;
  let transporter: Company;
  let destination: Company;
  let ecoOrganisme: Company;
  let bsdasri: any;
  let elasticBsdasri: BsdElastic;

  beforeAll(async () => {
    // Given
    emitter = await companyFactory({ name: "Emitter" });
    transporter = await companyFactory({ name: "Transporter" });
    destination = await companyFactory({ name: "Destination" });
    ecoOrganisme = await companyFactory({ name: "EcoOrganisme" });

    bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanyName: emitter.name,
        emitterCompanySiret: emitter.siret,
        transporterCompanyName: transporter.name,
        transporterCompanySiret: transporter.siret,
        destinationCompanyName: destination.name,
        destinationCompanySiret: destination.siret,
        ecoOrganismeName: ecoOrganisme.name,
        ecoOrganismeSiret: ecoOrganisme.siret
      }
    });

    const bsdasriForElastic = await getBsdasriForElastic(bsdasri);

    // When
    elasticBsdasri = toBsdElastic(bsdasriForElastic);
  });

  test("companiesNames > should contain the names of ALL BSDASRI companies", async () => {
    // Then
    expect(elasticBsdasri.companiesNames).toContain(emitter.name);
    expect(elasticBsdasri.companiesNames).toContain(transporter.name);
    expect(elasticBsdasri.companiesNames).toContain(destination.name);
    expect(elasticBsdasri.companiesNames).toContain(ecoOrganisme.name);
  });

  test("companiesSirets > should contain the sirets of ALL BSFF companies", async () => {
    // Then
    expect(elasticBsdasri.companiesSirets).toContain(emitter.siret);
    expect(elasticBsdasri.companiesSirets).toContain(transporter.siret);
    expect(elasticBsdasri.companiesSirets).toContain(destination.siret);
    expect(elasticBsdasri.companiesSirets).toContain(ecoOrganisme.siret);
  });
});
