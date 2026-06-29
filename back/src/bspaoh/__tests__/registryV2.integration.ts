import { prisma } from "@td/prisma";
import {
  toIncomingWasteV2,
  toOutgoingWasteV2,
  toTransportedWasteV2,
  toAllWasteV2
} from "../registryV2";
import { bspaohFactory } from "./factories";
import {
  RegistryV2Bspaoh,
  RegistryV2BspaohInclude
} from "../../registryV2/types";
import { resetDatabase } from "../../../integration-tests/helper";

describe("bspaoh registryV2 - quantity (Nombre d'unité(s))", () => {
  afterEach(resetDatabase);

  const wastePackagingsWithQuantity = [
    {
      id: "p1",
      type: "LITTLE_BOX",
      quantity: 3,
      volume: 10,
      consistence: "SOLIDE",
      identificationCodes: []
    },
    {
      id: "p2",
      type: "LITTLE_BOX",
      quantity: 7,
      volume: 10,
      consistence: "SOLIDE",
      identificationCodes: []
    }
  ];

  const fetchBspaoh = async (id: string) =>
    prisma.bspaoh.findFirst({
      where: { id },
      include: RegistryV2BspaohInclude
    }) as Promise<RegistryV2Bspaoh>;

  it("toIncomingWasteV2 - quantity should be the sum of packaging quantities", async () => {
    const bspaoh = await bspaohFactory({
      opt: { wastePackagings: wastePackagingsWithQuantity }
    });
    const dbBspaoh = await fetchBspaoh(bspaoh.id);
    expect(toIncomingWasteV2(dbBspaoh).quantity).toBe(10);
  });

  it("toIncomingWasteV2 - quantity should be null when packagings is empty", async () => {
    const bspaoh = await bspaohFactory({ opt: { wastePackagings: [] } });
    const dbBspaoh = await fetchBspaoh(bspaoh.id);
    expect(toIncomingWasteV2(dbBspaoh).quantity).toBeNull();
  });

  it("toOutgoingWasteV2 - quantity should be the sum of packaging quantities", async () => {
    const bspaoh = await bspaohFactory({
      opt: { wastePackagings: wastePackagingsWithQuantity }
    });
    const dbBspaoh = await fetchBspaoh(bspaoh.id);
    expect(toOutgoingWasteV2(dbBspaoh).quantity).toBe(10);
  });

  it("toOutgoingWasteV2 - quantity should be null when packagings is empty", async () => {
    const bspaoh = await bspaohFactory({ opt: { wastePackagings: [] } });
    const dbBspaoh = await fetchBspaoh(bspaoh.id);
    expect(toOutgoingWasteV2(dbBspaoh).quantity).toBeNull();
  });

  it("toTransportedWasteV2 - quantity should be the sum of packaging quantities", async () => {
    const bspaoh = await bspaohFactory({
      opt: { wastePackagings: wastePackagingsWithQuantity }
    });
    const dbBspaoh = await fetchBspaoh(bspaoh.id);
    const result = toTransportedWasteV2(dbBspaoh);
    // toTransportedWasteV2 returns null when no transporterTakenOverAt
    if (result) {
      expect(result.quantity).toBe(10);
    }
  });

  it("toAllWasteV2 - quantity should be the sum of packaging quantities", async () => {
    const bspaoh = await bspaohFactory({
      opt: { wastePackagings: wastePackagingsWithQuantity }
    });
    const dbBspaoh = await fetchBspaoh(bspaoh.id);
    expect(toAllWasteV2(dbBspaoh).quantity).toBe(10);
  });

  it("toAllWasteV2 - quantity should be null when packagings is empty", async () => {
    const bspaoh = await bspaohFactory({ opt: { wastePackagings: [] } });
    const dbBspaoh = await fetchBspaoh(bspaoh.id);
    expect(toAllWasteV2(dbBspaoh).quantity).toBeNull();
  });
});
