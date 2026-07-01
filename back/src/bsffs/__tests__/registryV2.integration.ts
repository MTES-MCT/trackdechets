import { prisma } from "@td/prisma";

import {
  toIncomingWasteV2,
  toOutgoingWasteV2,
  toTransportedWasteV2,
  toAllWasteV2
} from "../registryV2";

import { createBsff } from "./factories";

import { userWithCompanyFactory } from "../../__tests__/factories";

import { RegistryV2Bsff, RegistryV2BsffInclude } from "../../registryV2/types";

import { resetDatabase } from "../../../integration-tests/helper";

describe("bsff registryV2 - quantity (Nombre d'unité(s))", () => {
  afterEach(resetDatabase);

  const fetchBsff = async (id: string) =>
    prisma.bsff.findUniqueOrThrow({
      where: { id },
      include: RegistryV2BsffInclude
    }) as Promise<RegistryV2Bsff>;

  async function createBsffWithPackagings(count: number) {
    const emitter = await userWithCompanyFactory();
    const transporter = await userWithCompanyFactory();
    const destination = await userWithCompanyFactory();

    const bsff = await createBsff({
      emitter,
      transporter,
      destination
    });

    // Le createBsff crée déjà 1 packaging
    if (count === 0) {
      await prisma.bsffPackaging.deleteMany({
        where: { bsffId: bsff.id }
      });
    }

    // ajoute les packagings manquants
    for (let i = 1; i < count; i++) {
      await prisma.bsffPackaging.create({
        data: {
          bsffId: bsff.id,
          numero: `PACK-${i}`,
          emissionNumero: `EMISSION-${i}`,
          type: "BOUTEILLE",
          weight: 100
        }
      });
    }

    return bsff;
  }

  it("toIncomingWasteV2 - quantity should be the number of packagings", async () => {
    const bsff = await createBsffWithPackagings(3);

    const dbBsff = await fetchBsff(bsff.id);

    expect(toIncomingWasteV2(dbBsff).quantity).toBe(3);
  });

  it("toIncomingWasteV2 - quantity should be null when packagings is empty", async () => {
    const bsff = await createBsffWithPackagings(0);

    const dbBsff = await fetchBsff(bsff.id);

    expect(toIncomingWasteV2(dbBsff).quantity).toBeNull();
  });

  it("toOutgoingWasteV2 - quantity should be the number of packagings", async () => {
    const bsff = await createBsffWithPackagings(3);

    const dbBsff = await fetchBsff(bsff.id);

    expect(toOutgoingWasteV2(dbBsff).quantity).toBe(3);
  });

  it("toOutgoingWasteV2 - quantity should be null when packagings is empty", async () => {
    const bsff = await createBsffWithPackagings(0);

    const dbBsff = await fetchBsff(bsff.id);

    expect(toOutgoingWasteV2(dbBsff).quantity).toBeNull();
  });

  it("toTransportedWasteV2 - quantity should be the number of packagings", async () => {
    const bsff = await createBsffWithPackagings(3);

    const dbBsff = await fetchBsff(bsff.id);

    const result = toTransportedWasteV2(
      dbBsff,
      dbBsff.transporters[0].transporterCompanySiret!
    );

    expect(result).not.toBeNull();

    if (result) {
      expect(result.quantity).toBe(3);
    }
  });

  it("toAllWasteV2 - quantity should be the number of packagings", async () => {
    const bsff = await createBsffWithPackagings(3);

    const dbBsff = await fetchBsff(bsff.id);

    expect(toAllWasteV2(dbBsff).quantity).toBe(3);
  });

  it("toAllWasteV2 - quantity should be null when packagings is empty", async () => {
    const bsff = await createBsffWithPackagings(0);

    const dbBsff = await fetchBsff(bsff.id);

    expect(toAllWasteV2(dbBsff).quantity).toBeNull();
  });
});
