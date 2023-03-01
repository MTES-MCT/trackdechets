import { bsdasriFactory } from "../__tests__/factories";
import { userWithCompanyFactory } from "../../__tests__/factories";
import { resetDatabase } from "../../../integration-tests/helper";
import { checkEditionRules } from "../edition";

describe("edition rules", () => {
  afterAll(resetDatabase);

  it("should be possible to update any fields when BSDASRI status is INITIAL and type is SIMPLE", async () => {
    const bsdasri = await bsdasriFactory({
      opt: { status: "INITIAL", type: "SIMPLE" }
    });
    const checked = await checkEditionRules(bsdasri, {
      emitter: { company: { name: "ACME" } }
    });
    expect(checked).toBe(true);
  });

  it("should not be possible to update a field sealed by emission signature", async () => {
    const bsdasri = await bsdasriFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date()
      }
    });
    const checkFn = () =>
      checkEditionRules(bsdasri, {
        emitter: { company: { name: "ACME" } }
      });

    await expect(checkFn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : emitterCompanyName"
    );
  });

  it("should be possible for the emitter to update a field sealed by emission signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsdasri = await bsdasriFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: emitter.company.siret,
        emitterEmissionSignatureDate: new Date()
      }
    });
    const checked = await checkEditionRules(
      bsdasri,
      {
        emitter: { company: { name: "ACME" } }
      },
      emitter.user
    );

    expect(checked).toBe(true);
  });

  it("should be possible to re-send same data on a field sealed by emission signature", async () => {
    const bsdasri = await bsdasriFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date()
      }
    });
    const checked = await checkEditionRules(bsdasri, {
      emitter: { company: { siret: bsdasri.emitterCompanySiret } }
    });
    expect(checked).toBe(true);
  });

  it("should be possible to update a field not yet sealed by emission signature", async () => {
    const bsdasri = await bsdasriFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date()
      }
    });
    const checked = await checkEditionRules(bsdasri, {
      transporter: { transport: { plates: ["AD-008-TS"] } }
    });
    expect(checked).toBe(true);
  });

  it("should not be possible to update a field sealed by transporter signature", async () => {
    const bsdasri = await bsdasriFactory({
      opt: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
      }
    });

    const checkFn = () =>
      checkEditionRules(bsdasri, {
        transporter: {
          transport: {
            plates: ["AD-008-YT"]
          }
        }
      });

    await expect(checkFn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : transporterTransportPlates"
    );
  });

  it("should be possible to re-send same data on a field sealed by transporter signature", async () => {
    const bsdasri = await bsdasriFactory({
      opt: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
      }
    });
    const checked = await checkEditionRules(bsdasri, {
      transporter: { company: { siret: bsdasri.transporterCompanySiret } }
    });
    expect(checked).toBe(true);
  });

  it("should be possible to update a field not yet sealed by transport signature", async () => {
    const bsdasri = await bsdasriFactory({
      opt: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
      }
    });
    const checked = await checkEditionRules(bsdasri, {
      destination: { reception: { date: new Date("2021-01-01") } }
    });
    expect(checked).toBe(true);
  });

  it("should not be possible to update a field sealed by reception signature", async () => {
    const bsdasri = await bsdasriFactory({
      opt: {
        status: "RECEIVED",
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date(),
        destinationReceptionSignatureDate: new Date()
      }
    });

    const checkFn = () =>
      checkEditionRules(bsdasri, {
        destination: { reception: { date: new Date("2021-01-01") } }
      });

    await expect(checkFn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : destinationReceptionDate"
    );
  });

  it("should be possible to re-send same data on a field sealed by reception signature", async () => {
    const bsdasri = await bsdasriFactory({
      opt: {
        status: "RECEIVED",
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date(),
        destinationReceptionSignatureDate: new Date()
      }
    });
    const checked = await checkEditionRules(bsdasri, {
      destination: { reception: { date: bsdasri.destinationReceptionDate } }
    });
    expect(checked).toBe(true);
  });

  it("should be possible to update a field not yet sealed by reception signature", async () => {
    const bsdasri = await bsdasriFactory({
      opt: {
        status: "RECEIVED",
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date(),
        destinationReceptionSignatureDate: new Date()
      }
    });
    const checked = await checkEditionRules(bsdasri, {
      destination: { operation: { date: new Date("2021-01-01") } }
    });
    expect(checked).toBe(true);
  });

  it("should not be possible to update a field sealed by operation signature", async () => {
    const bsdasri = await bsdasriFactory({
      opt: {
        status: "PROCESSED",
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date(),
        destinationReceptionSignatureDate: new Date(),
        destinationOperationSignatureDate: new Date()
      }
    });

    const checkFn = () =>
      checkEditionRules(bsdasri, {
        destination: { operation: { date: new Date("2021-01-01") } }
      });

    await expect(checkFn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : destinationOperationDate"
    );
  });
});
