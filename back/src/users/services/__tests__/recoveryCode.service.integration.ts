import { hash } from "bcrypt";
import { resetDatabase } from "../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { userFactory } from "../../../__tests__/factories";
import { findValidRecoveryCode } from "../recoveryCode.service";

describe("findValidRecoveryCode", () => {
  afterEach(resetDatabase);

  it("matches a 20-character / 4-group recovery code regardless of dashes or case", async () => {
    const plainCode = "ABCDE-FGHIJ-KLMNO-PQRST";
    const normalized = plainCode.replace(/-/g, "").toUpperCase();
    const codeHash = await hash(normalized, 10);

    const user = await userFactory();
    const recoveryCode = await prisma.totpRecoveryCode.create({
      data: { userId: user.id, codeHash }
    });

    // with dashes, uppercase
    expect(await findValidRecoveryCode(user.id, plainCode)).toBe(
      recoveryCode.id
    );
    // without dashes, lowercase
    expect(await findValidRecoveryCode(user.id, normalized.toLowerCase())).toBe(
      recoveryCode.id
    );
  });

  it("returns null when the code does not match any stored hash", async () => {
    const user = await userFactory();
    await prisma.totpRecoveryCode.create({
      data: {
        userId: user.id,
        codeHash: await hash("AAAAABBBBBCCCCCDDDDD", 10)
      }
    });

    expect(
      await findValidRecoveryCode(user.id, "ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ")
    ).toBeNull();
  });
});
