import {
  buildFindUniqueBsffGetFicheInterventions,
  buildFindUniqueBsffGetPackagings
} from "../findUnique";

describe("bsffRepository.findUnique relations", () => {
  it("forwards a packaging select without adding an incompatible include", async () => {
    const foundPackagings = [{ id: "packaging-id" }];
    const packagings = jest.fn().mockResolvedValue(foundPackagings);
    const findUnique = jest.fn().mockReturnValue({ packagings });
    const repository = buildFindUniqueBsffGetPackagings({
      prisma: {
        bsff: { findUnique }
      } as any
    });

    const result = await repository(
      { where: { id: "bsff-id" } },
      { select: { id: true } }
    );

    expect(findUnique).toHaveBeenCalledWith({ where: { id: "bsff-id" } });
    expect(packagings).toHaveBeenCalledWith({ select: { id: true } });
    expect(result).toEqual(foundPackagings);
  });

  it("loads packagings with fiche interventions", async () => {
    const foundFiches = [{ id: "fiche-id", packagings: [] }];
    const ficheInterventions = jest.fn().mockResolvedValue(foundFiches);
    const findUnique = jest.fn().mockReturnValue({ ficheInterventions });
    const repository = buildFindUniqueBsffGetFicheInterventions({
      prisma: {
        bsff: { findUnique }
      } as any
    });

    const fiches = await repository(
      { where: { id: "bsff-id" } },
      {
        where: { id: "fiche-id" },
        include: { bsffs: true }
      }
    );

    expect(findUnique).toHaveBeenCalledWith({ where: { id: "bsff-id" } });
    expect(ficheInterventions).toHaveBeenCalledWith({
      where: { id: "fiche-id" },
      include: {
        bsffs: true,
        packagings: true
      }
    });
    expect(fiches?.[0].packagings).toEqual([]);
  });
});
