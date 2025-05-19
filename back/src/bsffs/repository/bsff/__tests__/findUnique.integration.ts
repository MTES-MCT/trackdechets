import { userFactory } from "../../../../__tests__/factories";
import { AuthType } from "../../../../auth/auth";
import { prisma } from "@td/prisma";
import getReadableId, { ReadableIdPrefix } from "../../../../forms/readableId";
import { getBsffRepository } from "../..";
import { resetDatabase } from "../../../../../integration-tests/helper";

describe("bsffRepository.findUnique", () => {
  afterEach(resetDatabase);

  it("should exclude deleted BSFF", async () => {
    const user = await userFactory();

    const { findUnique } = getBsffRepository({
      ...user,
      auth: AuthType.Session
    });
    const bsff = await prisma.bsff.create({
      data: { id: getReadableId(ReadableIdPrefix.FF), wasteCode: "14 06 01*" }
    });

    const deletedBsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        wasteCode: "14 06 01*",
        isDeleted: true
      }
    });

    expect(await findUnique({ where: { id: bsff.id } })).not.toBeNull();
    expect(await findUnique({ where: { id: deletedBsff.id } })).toBeNull();
  });
});
