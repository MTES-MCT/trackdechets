import { prisma } from "../../../../libs/back/prisma/src";
import { toOutgoingWaste } from "../registry";
import { bsvhuFactory } from "./factories.vhu";

describe("toGenericWaste", () => {
  it("should contain destinationCompanyMail", async () => {
    // Given
    const bsvhu = await bsvhuFactory({
      opt: { destinationCompanyMail: "destination@mail.com" }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id }
    });
    const waste = toOutgoingWaste(bsvhuForRegistry);

    // Then
    expect(waste.destinationCompanyMail).toBe("destination@mail.com");
  });
});
