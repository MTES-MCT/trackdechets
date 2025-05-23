import { prisma } from "@td/prisma";
import { toIncomingWasteV2 } from "../registryV2";
import { bsdaFactory } from "./factories";
import { RegistryV2Bsda, RegistryV2BsdaInclude } from "../../registryV2/types";
import { resetDatabase } from "../../../integration-tests/helper";

describe("registryV2", () => {
  afterEach(resetDatabase);

  it("quantity should return the total number of packagings", async () => {
    // Given
    const bsda = await bsdaFactory({
      opt: {
        packagings: [
          { quantity: 3, type: "PALETTE_FILME" },
          { quantity: 7, type: "DEPOT_BAG" }
        ]
      }
    });
    const dbBsda = await prisma.bsda.findFirst({
      where: { id: bsda.id },
      include: RegistryV2BsdaInclude
    });

    // When
    const incomingWaste = toIncomingWasteV2(dbBsda as RegistryV2Bsda);

    // Then
    expect(incomingWaste.quantity).toBe(10);
  });

  it("quantity should be null if no packaging", async () => {
    // Given
    const bsda = await bsdaFactory({
      opt: {
        packagings: []
      }
    });
    const dbBsda = await prisma.bsda.findFirst({
      where: { id: bsda.id },
      include: RegistryV2BsdaInclude
    });

    // When
    const incomingWaste = toIncomingWasteV2(dbBsda as RegistryV2Bsda);

    // Then
    expect(incomingWaste.quantity).toBeNull();
  });
});
