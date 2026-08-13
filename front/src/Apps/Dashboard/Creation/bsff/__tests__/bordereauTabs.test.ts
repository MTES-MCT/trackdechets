import { BsdType, BsffType } from "@td/codegen-ui";
import {
  getErrorTabIds,
  getNextTab,
  getPublishErrorTabIds,
  getTabs,
  isFluidesFrigorigenesTabVisible,
  TabId
} from "../../utils";
import initialState from "../utils/initial-state";

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

  it("rattache aussi les erreurs opérateur à l'onglet Bordereau", () => {
    expect(
      getPublishErrorTabIds(
        BsdType.Bsff,
        [emitterError],
        BsffType.CollectePetitesQuantites
      )
    ).toEqual([TabId.bordereau]);
    expect(
      getErrorTabIds(
        BsdType.Bsff,
        [],
        ["emitter"],
        BsffType.CollectePetitesQuantites
      )
    ).toEqual([TabId.bordereau]);
  });
});

describe("onglet App Fluides Frigorigènes du parcours opérateur", () => {
  const bsffTabIds = getTabs(BsdType.Bsff).map(tab => tab.tabId);

  it("désactive la connexion par défaut", () => {
    expect(initialState.fluidesFrigorigenesEnabled).toBe(false);
  });

  it("affiche l'onglet uniquement pour l'opérateur lorsque le toggle est actif", () => {
    expect(
      isFluidesFrigorigenesTabVisible(BsffType.CollectePetitesQuantites, false)
    ).toBe(false);
    expect(
      isFluidesFrigorigenesTabVisible(BsffType.CollectePetitesQuantites, true)
    ).toBe(true);
    expect(isFluidesFrigorigenesTabVisible(BsffType.TracerFluide, true)).toBe(
      false
    );
  });

  it("place l'onglet entre Bordereau et Déchet", () => {
    expect(bsffTabIds.slice(0, 3)).toEqual([
      TabId.bordereau,
      TabId.fluidesFrigorigenes,
      TabId.waste
    ]);
  });

  it("navigue vers Déchet quand l'onglet est masqué", () => {
    const visibleTabIds = bsffTabIds.filter(
      tabId => tabId !== TabId.fluidesFrigorigenes
    );
    expect(getNextTab(visibleTabIds, TabId.bordereau)).toBe(TabId.waste);
  });

  it("navigue vers App Fluides Frigorigènes quand l'onglet est affiché", () => {
    expect(getNextTab(bsffTabIds, TabId.bordereau)).toBe(
      TabId.fluidesFrigorigenes
    );
  });
});
