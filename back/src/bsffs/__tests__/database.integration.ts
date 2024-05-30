import { BsffType } from "@prisma/client";
import { resetDatabase } from "../../../integration-tests/helper";
import { getReadonlyBsffPackagingRepository } from "../repository";
import { createBsff } from "./factories";

describe("findPreviousPackagings", () => {
  afterAll(resetDatabase);

  it("should return previous packagings according to the number of hops", async () => {
    const bsff1 = await createBsff();

    // bsff2 is forwarding bsff1
    const bsff2 = await createBsff(
      {},
      {
        previousPackagings: bsff1.packagings,
        data: { type: BsffType.REEXPEDITION }
      }
    );

    const bsff3 = await createBsff();
    // bsff4 is repackaging bsff2 and bsff3
    const bsff4 = await createBsff(
      {},
      {
        previousPackagings: [...bsff2.packagings, ...bsff3.packagings],
        data: {
          type: BsffType.RECONDITIONNEMENT
        }
      }
    );
    const bsff5 = await createBsff();
    // bsff6 is grouping bsff5 and bsff4
    const bsff6 = await createBsff(
      {},
      {
        previousPackagings: [...bsff4.packagings, ...bsff5.packagings],
        data: { type: BsffType.GROUPEMENT }
      }
    );

    const previousPackagings =
      await getReadonlyBsffPackagingRepository().findPreviousPackagings(
        bsff6.packagings.map(p => p.id)
      );

    expect(previousPackagings.map(p => p.id)).toEqual([
      ...bsff1.packagings.map(p => p.id),
      ...bsff2.packagings.map(p => p.id),
      ...bsff3.packagings.map(p => p.id),
      ...bsff4.packagings.map(p => p.id),
      ...bsff5.packagings.map(p => p.id)
    ]);

    const previousPackagingsMaxHops1 =
      await getReadonlyBsffPackagingRepository().findPreviousPackagings(
        bsff6.packagings.map(p => p.id),
        1
      );

    expect(previousPackagingsMaxHops1.map(p => p.id)).toEqual([
      ...bsff4.packagings.map(p => p.id),
      ...bsff5.packagings.map(p => p.id)
    ]);
  });
});

describe("getNextPackagings", () => {
  afterAll(resetDatabase);

  it("should return next packagings according to the number of hops", async () => {
    const bsff1 = await createBsff();

    // bsff2 is forwarding bsff1
    const bsff2 = await createBsff(
      {},
      {
        previousPackagings: bsff1.packagings,
        data: {
          type: BsffType.REEXPEDITION
        }
      }
    );

    const bsff3 = await createBsff();
    // bsff4 is repackaging bsff2 and bsff3
    const bsff4 = await createBsff(
      {},
      {
        previousPackagings: [...bsff2.packagings, ...bsff3.packagings],
        data: { type: BsffType.RECONDITIONNEMENT }
      }
    );
    const bsff5 = await createBsff();
    // bsff6 is grouping bsff5 and bsff4
    const bsff6 = await createBsff(
      {},
      {
        previousPackagings: [...bsff4.packagings, ...bsff5.packagings],
        data: { type: BsffType.GROUPEMENT }
      }
    );

    const nextPackagings =
      await getReadonlyBsffPackagingRepository().findNextPackagings(
        bsff1.packagings[0].id
      );

    expect(nextPackagings.map(p => p.id)).toEqual([
      bsff2.packagings[0].id,
      bsff4.packagings[0].id,
      bsff6.packagings[0].id
    ]);
  });
});
