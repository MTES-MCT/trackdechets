import { resetDatabase } from "../../../integration-tests/helper";
import { companyFactory } from "../../__tests__/factories";
import { getBsdasriForElastic, toBsdElastic } from "../elastic";
import { BsdElastic } from "../../common/elastic";
import { bsdasriFactory } from "./factories";
import { BsdasriStatus, Company, WasteAcceptationStatus } from "@prisma/client";
import { xDaysAgo } from "../../utils";

describe("toBsdElastic > companies Names & OrgIds", () => {
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
    transporter = await companyFactory({
      name: "Transporter",
      vatNumber: "VAT Transporter"
    });
    destination = await companyFactory({ name: "Destination" });
    ecoOrganisme = await companyFactory({ name: "EcoOrganisme" });

    bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanyName: emitter.name,
        emitterCompanySiret: emitter.siret,
        transporterCompanyName: transporter.name,
        transporterCompanySiret: transporter.siret,
        transporterCompanyVatNumber: transporter.vatNumber,
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

  test("companyNames > should contain the names of ALL BSDASRI companies", async () => {
    // Then
    expect(elasticBsdasri.companyNames).toContain(emitter.name);
    expect(elasticBsdasri.companyNames).toContain(transporter.name);
    expect(elasticBsdasri.companyNames).toContain(destination.name);
    expect(elasticBsdasri.companyNames).toContain(ecoOrganisme.name);
  });

  test("companyOrgIds > should contain the orgIds of ALL BSDASRI companies", async () => {
    // Then
    expect(elasticBsdasri.companyOrgIds).toContain(emitter.siret);
    expect(elasticBsdasri.companyOrgIds).toContain(transporter.vatNumber);
    expect(elasticBsdasri.companyOrgIds).toContain(destination.siret);
    expect(elasticBsdasri.companyOrgIds).toContain(ecoOrganisme.siret);
  });

  describe("isReturnFor", () => {
    it.each([
      WasteAcceptationStatus.REFUSED,
      WasteAcceptationStatus.PARTIALLY_REFUSED
    ])(
      "waste acceptation status is %p > bsvhu should belong to tab",
      async destinationReceptionAcceptationStatus => {
        // Given
        const transporter = await companyFactory();
        const bsdasri = await bsdasriFactory({
          opt: {
            emitterCompanyName: emitter.name,
            emitterCompanySiret: emitter.siret,
            transporterCompanyName: transporter.name,
            transporterCompanySiret: transporter.siret,
            destinationReceptionDate: new Date(),
            destinationReceptionAcceptationStatus
          }
        });

        // When
        const bsdasriForElastic = await getBsdasriForElastic(bsdasri);
        const { isReturnFor } = toBsdElastic(bsdasriForElastic);

        // Then
        expect(isReturnFor).toContain(transporter.siret);
      }
    );

    it("status is REFUSED > bsvhu should belong to tab", async () => {
      // Given
      const transporter = await companyFactory();
      const bsdasri = await bsdasriFactory({
        opt: {
          emitterCompanyName: emitter.name,
          emitterCompanySiret: emitter.siret,
          transporterCompanyName: transporter.name,
          transporterCompanySiret: transporter.siret,
          destinationReceptionDate: new Date(),
          status: BsdasriStatus.REFUSED
        }
      });

      // When
      const bsdasriForElastic = await getBsdasriForElastic(bsdasri);
      const { isReturnFor } = toBsdElastic(bsdasriForElastic);

      // Then
      expect(isReturnFor).toContain(transporter.siret);
    });

    it("waste acceptation status is ACCEPTED > bsvhu should not belong to tab", async () => {
      // Given
      const transporter = await companyFactory();
      const bsdasri = await bsdasriFactory({
        opt: {
          emitterCompanyName: emitter.name,
          emitterCompanySiret: emitter.siret,
          transporterCompanyName: transporter.name,
          transporterCompanySiret: transporter.siret,
          destinationReceptionDate: new Date(),
          destinationReceptionAcceptationStatus: WasteAcceptationStatus.ACCEPTED
        }
      });

      // When
      const bsdasriForElastic = await getBsdasriForElastic(bsdasri);
      const { isReturnFor } = toBsdElastic(bsdasriForElastic);

      // Then
      expect(isReturnFor).toStrictEqual([]);
    });

    it("bsda has been received too long ago > should not belong to tab", async () => {
      // Given
      const transporter = await companyFactory();
      const bsdasri = await bsdasriFactory({
        opt: {
          emitterCompanyName: emitter.name,
          emitterCompanySiret: emitter.siret,
          transporterCompanyName: transporter.name,
          transporterCompanySiret: transporter.siret,
          destinationReceptionDate: xDaysAgo(new Date(), 10),
          destinationReceptionAcceptationStatus: WasteAcceptationStatus.REFUSED
        }
      });

      // When
      const bsdasriForElastic = await getBsdasriForElastic(bsdasri);
      const { isReturnFor } = toBsdElastic(bsdasriForElastic);

      // Then
      expect(isReturnFor).toStrictEqual([]);
    });
  });
});
