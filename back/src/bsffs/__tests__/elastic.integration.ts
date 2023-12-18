import { resetDatabase } from "../../../integration-tests/helper";
import {
  UserWithCompany,
  userWithCompanyFactory
} from "../../__tests__/factories";
import { getBsffForElastic, toBsdElastic } from "../elastic";
import { BsdElastic } from "../../common/elastic";
import { createBsff } from "./factories";

describe("toBsdElastic > companies Names & Sirets", () => {
  afterEach(resetDatabase);

  let emitter: UserWithCompany;
  let transporter: UserWithCompany;
  let destination: UserWithCompany;
  let bsda: any;
  let elasticBsff: BsdElastic;

  beforeAll(async () => {
    // Given
    emitter = await userWithCompanyFactory("ADMIN", { name: "Emitter" });
    transporter = await userWithCompanyFactory("ADMIN", {
      name: "Transporter"
    });
    destination = await userWithCompanyFactory("ADMIN", {
      name: "Destination"
    });

    bsda = await createBsff({
      emitter,
      transporter,
      destination
    });

    const bsffForElastic = await getBsffForElastic(bsda);

    // When
    elasticBsff = toBsdElastic(bsffForElastic);
  });

  test("companiesNames > should contain the names of ALL BSFF companies", async () => {
    // Then
    expect(elasticBsff.companiesNames).toContain(emitter.company.name);
    expect(elasticBsff.companiesNames).toContain(transporter.company.name);
    expect(elasticBsff.companiesNames).toContain(destination.company.name);
  });

  test("companiesSirets > should contain the sirets of ALL BSFF companies", async () => {
    // Then
    expect(elasticBsff.companiesSirets).toContain(emitter.company.siret);
    expect(elasticBsff.companiesSirets).toContain(transporter.company.siret);
    expect(elasticBsff.companiesSirets).toContain(destination.company.siret);
  });
});
