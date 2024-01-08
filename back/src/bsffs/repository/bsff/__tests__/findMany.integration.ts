import { userFactory } from "../../../../__tests__/factories";
import { AuthType } from "../../../../auth";
import { prisma } from "@td/prisma";
import getReadableId, { ReadableIdPrefix } from "../../../../forms/readableId";
import { getBsffRepository } from "../..";
import { resetDatabase } from "../../../../../integration-tests/helper";

describe("bsffRepository.findMany", () => {
  afterEach(resetDatabase);

  it("should exclude deleted BSFF", async () => {
    const user = await userFactory();

    const { findMany } = getBsffRepository({
      ...user,
      auth: AuthType.Session
    });
    const bsff1 = await prisma.bsff.create({
      data: { id: getReadableId(ReadableIdPrefix.FF), wasteCode: "14 06 01*" }
    });

    await prisma.bsff.create({
      data: { id: getReadableId(ReadableIdPrefix.FF), wasteCode: "14 06 02*" }
    });

    await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        wasteCode: "14 06 01*",
        isDeleted: true
      }
    });

    const bsffs = await findMany({ where: { wasteCode: "14 06 01*" } });
    expect(bsffs).toHaveLength(1);
    expect(bsffs[0].id).toEqual(bsff1.id);
  });
});
