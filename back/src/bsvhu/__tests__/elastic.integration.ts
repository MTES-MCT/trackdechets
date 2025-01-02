import { BsvhuStatus, Company, WasteAcceptationStatus } from "@prisma/client";
import { resetDatabase } from "../../../integration-tests/helper";
import { companyFactory } from "../../__tests__/factories";
import { BsdElastic } from "../../common/elastic";
import { getWhere, toBsdElastic } from "../elastic";
import { bsvhuFactory, toIntermediaryCompany } from "./factories.vhu";
import { xDaysAgo } from "../../utils";

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
  let broker: Company;
  let trader: Company;

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
    broker = await companyFactory({ name: "Broker" });
    trader = await companyFactory({ name: "Trader" });
    bsvhu = await bsvhuFactory({
      opt: {
        customId: "my custom id",
        emitterCompanyName: emitter.name,
        emitterCompanySiret: emitter.siret,
        transporterCompanyName: transporter.name,
        transporterCompanySiret: transporter.siret,
        transporterCompanyVatNumber: transporter.vatNumber,
        transporterTransportPlates: ["XY-87-IU"],
        destinationCompanyName: destination.name,
        destinationCompanySiret: destination.siret,
        ecoOrganismeName: ecoOrganisme.name,
        ecoOrganismeSiret: ecoOrganisme.siret,
        brokerCompanySiret: broker.siret,
        brokerCompanyName: broker.name,
        traderCompanySiret: trader.siret,
        traderCompanyName: trader.name,
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

  test("customId should be indexed", async () => {
    // Then
    expect(elasticBsvhu.customId).toContain("my custom id");
  });

  test("companyNames > should contain the names of ALL BSVHU companies", async () => {
    // Then
    expect(elasticBsvhu.companyNames).toContain(emitter.name);
    expect(elasticBsvhu.companyNames).toContain(transporter.name);
    expect(elasticBsvhu.companyNames).toContain(destination.name);
    expect(elasticBsvhu.companyNames).toContain(intermediary1.name);
    expect(elasticBsvhu.companyNames).toContain(intermediary2.name);
    expect(elasticBsvhu.companyNames).toContain(ecoOrganisme.name);
    expect(elasticBsvhu.companyNames).toContain(broker.name);
    expect(elasticBsvhu.companyNames).toContain(trader.name);
  });

  test("companyOrgIds > should contain the orgIds of ALL BSVHU companies", async () => {
    // Then
    expect(elasticBsvhu.companyOrgIds).toContain(emitter.siret);
    expect(elasticBsvhu.companyOrgIds).toContain(transporter.vatNumber);
    expect(elasticBsvhu.companyOrgIds).toContain(destination.siret);
    expect(elasticBsvhu.companyOrgIds).toContain(intermediary1.siret);
    expect(elasticBsvhu.companyOrgIds).toContain(intermediary2.siret);
    expect(elasticBsvhu.companyOrgIds).toContain(ecoOrganisme.siret);
    expect(elasticBsvhu.companyOrgIds).toContain(broker.siret);
    expect(elasticBsvhu.companyOrgIds).toContain(trader.siret);
  });

  test("companyOrgIds > should contain the orgIds of ALL BSVHU companies", async () => {
    // Then
    expect(elasticBsvhu.companyOrgIds).toContain(emitter.siret);
    expect(elasticBsvhu.companyOrgIds).toContain(transporter.vatNumber);
    expect(elasticBsvhu.companyOrgIds).toContain(destination.siret);
    expect(elasticBsvhu.companyOrgIds).toContain(intermediary1.siret);
    expect(elasticBsvhu.companyOrgIds).toContain(intermediary2.siret);
    expect(elasticBsvhu.companyOrgIds).toContain(ecoOrganisme.siret);
    expect(elasticBsvhu.companyOrgIds).toContain(broker.siret);
    expect(elasticBsvhu.companyOrgIds).toContain(trader.siret);
  });
  test("plates should be indexed", async () => {
    // Then
    expect(elasticBsvhu.transporterTransportPlates).toEqual(["XY87IU"]);
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
        const bsvhu = await bsvhuFactory({
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
        const { isReturnFor } = toBsdElastic(bsvhu);

        // Then
        expect(isReturnFor).toContain(transporter.siret);
      }
    );

    it("status is REFUSED > bsvhu should belong to tab", async () => {
      // Given
      const transporter = await companyFactory();
      const bsvhu = await bsvhuFactory({
        opt: {
          emitterCompanyName: emitter.name,
          emitterCompanySiret: emitter.siret,
          transporterCompanyName: transporter.name,
          transporterCompanySiret: transporter.siret,
          destinationReceptionDate: new Date(),
          status: BsvhuStatus.REFUSED
        }
      });

      // When
      const { isReturnFor } = toBsdElastic(bsvhu);

      // Then
      expect(isReturnFor).toContain(transporter.siret);
    });

    it("waste acceptation status is ACCEPTED > bsvhu should not belong to tab", async () => {
      // Given
      const transporter = await companyFactory();
      const bsvhu = await bsvhuFactory({
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
      const { isReturnFor } = toBsdElastic(bsvhu);

      // Then
      expect(isReturnFor).toStrictEqual([]);
    });

    it("bsda has been received too long ago > should not belong to tab", async () => {
      // Given
      const transporter = await companyFactory();
      const bsvhu = await bsvhuFactory({
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
      const { isReturnFor } = toBsdElastic(bsvhu);

      // Then
      expect(isReturnFor).toStrictEqual([]);
    });
  });
});
