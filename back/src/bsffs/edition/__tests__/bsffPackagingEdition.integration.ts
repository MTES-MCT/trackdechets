import {
  createBsffAfterAcceptation,
  createBsffAfterOperation,
  createBsffAfterReception
} from "../../__tests__/factories";
import { userWithCompanyFactory } from "../../../__tests__/factories";
import { resetDatabase } from "../../../../integration-tests/helper";
import { checkEditionRules } from "../bsffPackagingEdition";
import type { BsffOperationCode } from "@td/codegen-back";

describe("edition rules", () => {
  afterAll(resetDatabase);

  it("should be possible to update any fields when packaging has no signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterReception({
      emitter,
      transporter,
      destination
    });
    const checked = await checkEditionRules(bsff.packagings[0], {
      acceptation: { weight: 200, date: new Date(), status: "ACCEPTED" }
    });
    expect(checked).toBe(true);
  });

  it("should not be possible to update a field sealed by acceptation signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterAcceptation({
      emitter,
      transporter,
      destination
    });

    const checkFn = () =>
      checkEditionRules(bsff.packagings[0], {
        acceptation: { weight: 0, date: new Date(), status: "REFUSED" }
      });

    await expect(checkFn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés" +
        " : acceptationDate, acceptationWeight, acceptationStatus"
    );
  });

  it("should be possible to re-send same data on a field sealed by acceptation signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterAcceptation({
      emitter,
      transporter,
      destination
    });

    const checked = await checkEditionRules(bsff.packagings[0], {
      acceptation: {
        weight: bsff.packagings[0].acceptationWeight!,
        date: bsff.packagings[0].acceptationDate!,
        status: bsff.packagings[0].acceptationStatus!
      }
    });
    expect(checked).toBe(true);
  });

  it("should be possible to update a field not yet sealed by acceptation signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterAcceptation({
      emitter,
      transporter,
      destination
    });

    const checked = await checkEditionRules(bsff.packagings[0], {
      operation: {
        code: "D10",
        date: new Date(),
        description: "operation"
      }
    });
    expect(checked).toBe(true);
  });

  it("should not be possible to update any field after operation signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterOperation({
      emitter,
      transporter,
      destination
    });

    const checkFn = () =>
      checkEditionRules(bsff.packagings[0], {
        operation: { code: "D10", date: new Date(), description: "operation" }
      });

    await expect(checkFn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés" +
        " : operationDate, operationCode, operationDescription"
    );
  });

  it("should be possible to re-send same data on a field sealed by operation signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterAcceptation({
      emitter,
      transporter,
      destination
    });

    const checked = await checkEditionRules(bsff.packagings[0], {
      operation: {
        code: bsff.packagings[0].operationCode as BsffOperationCode,
        date: bsff.packagings[0].operationDate!,
        description: bsff.packagings[0].operationDescription!
      }
    });
    expect(checked).toBe(true);
  });
});
