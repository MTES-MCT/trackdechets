import { WasteNode, toWasteTree } from "../WASTES";

describe("toWasteTree", () => {
  it("should exclude an item based on wasteCode", () => {
    const wasteTree: WasteNode[] = [
      {
        code: "01",
        description:
          "DÉCHETS PROVENANT DE L'EXPLORATION ET DE L'EXPLOITATION DES MINES ET DES CARRIÈRES AINSI QUE DU TRAITEMENT PHYSIQUE ET CHIMIQUE DES MINÉRAUX",
        children: [
          {
            code: "01 01",
            description: "déchets provenant de l'extraction des minéraux",
            children: [
              {
                code: "01 01 01",
                description:
                  "déchets provenant de l'extraction des minéraux métallifères",
                children: []
              },
              {
                code: "01 01 02",
                description:
                  "déchets provenant de l'extraction des minéraux non métallifères",
                children: []
              }
            ]
          }
        ]
      }
    ];

    expect(toWasteTree(wasteTree, { exclude: ["01 01 02"] })).toEqual([
      {
        code: "01",
        description:
          "DÉCHETS PROVENANT DE L'EXPLORATION ET DE L'EXPLOITATION DES MINES ET DES CARRIÈRES AINSI QUE DU TRAITEMENT PHYSIQUE ET CHIMIQUE DES MINÉRAUX",
        children: [
          {
            code: "01 01",
            description: "déchets provenant de l'extraction des minéraux",
            children: [
              {
                code: "01 01 01",
                description:
                  "déchets provenant de l'extraction des minéraux métallifères",
                children: []
              }
            ]
          }
        ]
      }
    ]);
  });
});
