import { bsvhuFactory } from "./factories.vhu";
import { userWithCompanyFactory } from "../../__tests__/factories";
import { resetDatabase } from "../../../integration-tests/helper";
import { checkEditionRules } from "../edition";

describe("edition rules", () => {
  afterAll(resetDatabase);

  it("should be possible to update any fields when BSVHU status is INITIAL", async () => {
    const bsvhu = await bsvhuFactory({
      opt: { status: "INITIAL" }
    });
    const checked = await checkEditionRules(bsvhu, {
      emitter: { company: { name: "ACME" } }
    });
    expect(checked).toBe(true);
  });

  it("should not be possible to update a field sealed by emission signature", async () => {
    const bsvhu = await bsvhuFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date()
      }
    });
    const checkFn = () =>
      checkEditionRules(bsvhu, {
        emitter: { company: { name: "ACME" } }
      });

    await expect(checkFn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : emitterCompanyName"
    );
  });

  it("should be possible for the emitter to update a field sealed by emission signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsvhu = await bsvhuFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: emitter.company.siret,
        emitterEmissionSignatureDate: new Date()
      }
    });
    const checked = await checkEditionRules(
      bsvhu,
      {
        emitter: { company: { name: "ACME" } }
      },
      emitter.user
    );

    expect(checked).toBe(true);
  });

  it("should be possible to re-send same data on a field sealed by emission signature", async () => {
    const bsvhu = await bsvhuFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date()
      }
    });
    const checked = await checkEditionRules(bsvhu, {
      emitter: { company: { siret: bsvhu.emitterCompanySiret } }
    });
    expect(checked).toBe(true);
  });

  it("should be possible to update a field not yet sealed by emission signature", async () => {
    const bsvhu = await bsvhuFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date()
      }
    });
    const checked = await checkEditionRules(bsvhu, {
      transporter: { transport: { takenOverAt: new Date() } }
    });
    expect(checked).toBe(true);
  });

  it("should not be possible to update a field sealed by transporter signature", async () => {
    const bsvhu = await bsvhuFactory({
      opt: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
      }
    });

    const checkFn = () =>
      checkEditionRules(bsvhu, {
        transporter: {
          transport: {
            takenOverAt: new Date()
          }
        }
      });

    await expect(checkFn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : transporterTransportTakenOverAt"
    );
  });

  it("should be possible to re-send same data on a field sealed by transporter signature", async () => {
    const bsvvhu = await bsvhuFactory({
      opt: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
      }
    });
    const checked = await checkEditionRules(bsvvhu, {
      transporter: { company: { siret: bsvvhu.transporterCompanySiret } }
    });
    expect(checked).toBe(true);
  });

  it("should be possible to update a field not yet sealed by transport signature", async () => {
    const bsvhu = await bsvhuFactory({
      opt: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
      }
    });
    const checked = await checkEditionRules(bsvhu, {
      destination: { reception: { date: new Date("2021-01-01") } }
    });
    expect(checked).toBe(true);
  });

  it("should not be possible to update a field sealed by operation signature", async () => {
    const bsvhu = await bsvhuFactory({
      opt: {
        status: "PROCESSED",
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date(),
        destinationOperationSignatureDate: new Date()
      }
    });

    const checkFn = () =>
      checkEditionRules(bsvhu, {
        destination: { operation: { date: new Date("2021-01-01") } }
      });

    await expect(checkFn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : destinationOperationDate"
    );
  });
});
