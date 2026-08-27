import { BsdType, BsffType } from "@td/codegen-ui";
import { getErrorTabIds, getPublishErrorTabIds, TabId } from "../../utils";

const emitterError = {
  code: "BAD_USER_INPUT",
  path: ["emitter", "company", "phone"],
  message: "Le téléphone est requis"
};

describe("onglets du parcours BSFF détenteur", () => {
  it("rattache les erreurs émetteur à l'onglet Bordereau", () => {
    expect(
      getPublishErrorTabIds(BsdType.Bsff, [emitterError], BsffType.TracerFluide)
    ).toEqual([TabId.bordereau]);
    expect(
      getErrorTabIds(BsdType.Bsff, [], ["emitter"], BsffType.TracerFluide)
    ).toEqual([TabId.bordereau]);
  });

  it("conserve l'onglet Opérateur pour les autres parcours BSFF", () => {
    expect(
      getPublishErrorTabIds(
        BsdType.Bsff,
        [emitterError],
        BsffType.CollectePetitesQuantites
      )
    ).toEqual([TabId.emitter]);
    expect(
      getErrorTabIds(
        BsdType.Bsff,
        [],
        ["emitter"],
        BsffType.CollectePetitesQuantites
      )
    ).toEqual([TabId.emitter]);
  });
});
