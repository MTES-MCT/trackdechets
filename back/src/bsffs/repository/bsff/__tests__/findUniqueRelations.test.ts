import { buildFindUniqueBsffGetFicheInterventions } from "../findUnique";

describe("bsffRepository.findUnique relations", () => {
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
