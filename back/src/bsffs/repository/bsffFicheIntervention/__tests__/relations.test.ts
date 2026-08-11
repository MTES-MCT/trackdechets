import { buildCreateBsffFicheIntervention } from "../create";
import { buildFindManyBsffFicheIntervention } from "../findMany";

describe("BsffFicheIntervention repository relations", () => {
  it("loads packagings when creating a fiche intervention", async () => {
    const createdFiche = { id: "fiche-id", packagings: [] };
    const prisma = {
      bsffFicheIntervention: {
        create: jest.fn().mockResolvedValue(createdFiche)
      },
      event: {
        create: jest.fn().mockResolvedValue(undefined)
      }
    } as any;
    const create = buildCreateBsffFicheIntervention({
      prisma,
      user: { id: "user-id", auth: "SESSION" } as Express.User
    });

    const fiche = await create({
      data: {} as any,
      include: { bsffs: true }
    });

    expect(prisma.bsffFicheIntervention.create).toHaveBeenCalledWith({
      data: {},
      include: {
        bsffs: true,
        packagings: true
      }
    });
    expect(fiche.packagings).toEqual([]);
  });

  it("loads packagings when finding fiche interventions", async () => {
    const foundFiches = [{ id: "fiche-id", packagings: [] }];
    const prisma = {
      bsffFicheIntervention: {
        findMany: jest.fn().mockResolvedValue(foundFiches)
      }
    } as any;
    const findMany = buildFindManyBsffFicheIntervention({ prisma });

    const fiches = await findMany({
      where: { id: "fiche-id" },
      include: { bsffs: true }
    });

    expect(prisma.bsffFicheIntervention.findMany).toHaveBeenCalledWith({
      where: { id: "fiche-id" },
      include: {
        bsffs: true,
        packagings: true
      }
    });
    expect(fiches[0].packagings).toEqual([]);
  });
});
