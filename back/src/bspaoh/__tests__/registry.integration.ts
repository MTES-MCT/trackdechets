import { prisma } from "@td/prisma";
import { RegistryBspaohInclude } from "../../registry/elastic";
import { toOutgoingWaste } from "../registry";
import { bspaohFactory } from "./factories";

describe("toGenericWaste", () => {
  it("should contain destinationCompanyMail", async () => {
    // Given
    const paoh = await bspaohFactory({
      opt: { destinationCompanyMail: "destination@mail.com" }
    });

    // When
    const paohForRegistry = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: paoh.id },
      include: RegistryBspaohInclude
    });
    const waste = toOutgoingWaste(paohForRegistry);

    // Then
    expect(waste.destinationCompanyMail).toBe("destination@mail.com");
  });
});
