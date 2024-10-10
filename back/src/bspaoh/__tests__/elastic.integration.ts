import { resetDatabase } from "../../../integration-tests/helper";
import { companyFactory } from "../../__tests__/factories";
import { getBspaohForElastic, toBsdElastic } from "../elastic";
import { BsdElastic } from "../../common/elastic";
import { bspaohFactory } from "./factories";
import { Company, WasteAcceptationStatus } from "@prisma/client";
import { xDaysAgo } from "../../utils";

describe("toBsdElastic > companies Names & OrgIds", () => {
  afterEach(resetDatabase);

  let emitter: Company;
  let transporter: Company;
  let destination: Company;

  let bspaoh: any;
  let elasticBspaoh: BsdElastic;

  beforeAll(async () => {
    // Given
    emitter = await companyFactory({ name: "Emitter" });
    transporter = await companyFactory({
      name: "Transporter",
      vatNumber: "VAT Transporter"
    });
    destination = await companyFactory({ name: "Destination" });

    bspaoh = await bspaohFactory({
      opt: {
        emitterCompanyName: emitter.name,
        emitterCompanySiret: emitter.siret,

        destinationCompanyName: destination.name,
        destinationCompanySiret: destination.siret,
        transporters: {
          create: {
            transporterCompanyName: transporter.name,
            transporterCompanySiret: transporter.siret,
            transporterCompanyVatNumber: transporter.vatNumber,
            number: 1
          }
        }
      }
    });

    const bspaohForElastic = await getBspaohForElastic(bspaoh);

    elasticBspaoh = toBsdElastic(bspaohForElastic);
  });

  test("companyNames > should contain the names of ALL BSPAOH companies", async () => {
    expect(elasticBspaoh.companyNames).toContain(emitter.name);
    expect(elasticBspaoh.companyNames).toContain(transporter.name);
    expect(elasticBspaoh.companyNames).toContain(destination.name);
  });

  test("companyOrgIds > should contain the orgIds of ALL BSPAOH companies", async () => {
    expect(elasticBspaoh.companyOrgIds).toContain(emitter.siret);
    expect(elasticBspaoh.companyOrgIds).toContain(transporter.vatNumber);
    expect(elasticBspaoh.companyOrgIds).toContain(destination.siret);
  });

  describe("isReturnFor", () => {
    it.each([
      WasteAcceptationStatus.REFUSED,
      WasteAcceptationStatus.PARTIALLY_REFUSED
    ])(
      "waste acceptation status is %p > bspaoh should belong to tab",
      async destinationReceptionAcceptationStatus => {
        // Given
        const transporter = await companyFactory();
        const bspaoh = await bspaohFactory({
          opt: {
            emitterCompanyName: emitter.name,
            emitterCompanySiret: emitter.siret,
            destinationReceptionDate: new Date(),
            destinationReceptionAcceptationStatus,
            transporters: {
              create: {
                transporterCompanyName: transporter.name,
                transporterCompanySiret: transporter.siret,
                transporterCompanyVatNumber: transporter.vatNumber,
                number: 1
              }
            }
          }
        });

        // When
        const bspaohForElastic = await getBspaohForElastic(bspaoh);
        const { isReturnFor } = toBsdElastic(bspaohForElastic);

        // Then
        expect(isReturnFor).toContain(transporter.siret);
      }
    );

    it("waste acceptation status is ACCEPTED > bspaoh should not belong to tab", async () => {
      // Given
      const transporter = await companyFactory();
      const bspaoh = await bspaohFactory({
        opt: {
          emitterCompanyName: emitter.name,
          emitterCompanySiret: emitter.siret,
          destinationReceptionDate: new Date(),
          destinationReceptionAcceptationStatus:
            WasteAcceptationStatus.ACCEPTED,
          transporters: {
            create: {
              transporterCompanyName: transporter.name,
              transporterCompanySiret: transporter.siret,
              transporterCompanyVatNumber: transporter.vatNumber,
              number: 1
            }
          }
        }
      });

      // When
      const bspaohForElastic = await getBspaohForElastic(bspaoh);
      const { isReturnFor } = toBsdElastic(bspaohForElastic);

      // Then
      expect(isReturnFor).toStrictEqual([]);
    });

    it("bsda has been received too long ago > should not belong to tab", async () => {
      // Given
      const transporter = await companyFactory();
      const bspaoh = await bspaohFactory({
        opt: {
          emitterCompanyName: emitter.name,
          emitterCompanySiret: emitter.siret,
          destinationReceptionDate: xDaysAgo(new Date(), 10),
          destinationReceptionAcceptationStatus: WasteAcceptationStatus.REFUSED,
          transporters: {
            create: {
              transporterCompanyName: transporter.name,
              transporterCompanySiret: transporter.siret,
              transporterCompanyVatNumber: transporter.vatNumber,
              number: 1
            }
          }
        }
      });

      // When
      const bspaohForElastic = await getBspaohForElastic(bspaoh);
      const { isReturnFor } = toBsdElastic(bspaohForElastic);

      // Then
      expect(isReturnFor).toStrictEqual([]);
    });
  });
});
