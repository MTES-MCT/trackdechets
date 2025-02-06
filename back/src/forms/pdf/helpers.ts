import { PackagingInfo } from "@td/codegen-back";
import { pluralize } from "@td/constants";
import Decimal from "decimal.js";

const packagingsLabel = {
  FUT: "Fût",
  GRV: "GRV",
  CITERNE: "Citerne",
  BENNE: "Benne",
  PIPELINE: "Conditionné pour pipeline",
  AUTRE: "Autre"
};

/**
 * Permet de calculer les lignes du tableau de conditionnement <PackagingInfosTable />
 */
export function getPackagingsRows(packagingInfos: PackagingInfo[]) {
  const packagingsByType: { [key: string]: PackagingInfo[] } =
    packagingInfos.reduce((acc, packaging) => {
      return {
        ...acc,
        [packaging.type]: [...(acc[packaging.type] ?? []), packaging]
      };
    }, {});

  const packagingsRows = Object.keys(packagingsByType).map(type => {
    const packagings = packagingsByType[type];

    // Nombre total de conditionnement pour un type donné
    const totalQuantity = packagings.reduce(
      (totalQuantity, p) => totalQuantity + (p.quantity ?? 0),
      0
    );

    let conditionnement: string = pluralize(
      packagingsLabel[type],
      totalQuantity
    );

    // Liste les différentes valeurs de volume
    const volumes = [...new Set(packagings.map(p => p.volume))];
    // Liste les différentes valeurs possibles pour les conditionnements "Autres"
    const others = [...new Set(packagings.map(p => p.other))].filter(Boolean);

    if (volumes.length > 1 || others.length > 0) {
      // Dans ce cas, on va ajouter une liste entre parenthèse après
      // le type de conditonnement
      // Ex : Fûts (2 x 5L, 4, 6 x 9L) ou Autres (2 Caisse plastique x 20L, 5 tupperware)
      const packagingDetails = packagings.map(p => {
        return [
          p.quantity,
          ...(p.other ? [" ", p.other] : []),
          ...(p.volume
            ? [
                " x ",
                p.volume,
                // l'unité est forcément en litre car le conditionnement Benne qui s'exprime en m3
                // ne peut pas être combiné avec un autre type de conditionnement
                "l"
              ]
            : [])
        ]
          .filter(Boolean)
          .join("");
      });
      conditionnement = [
        conditionnement,
        " (",
        packagingDetails.join(", "),
        ")"
      ].join("");
    } else if (volumes.length === 1) {
      // Un seul type de volume :
      // On ajoute la valeur après le type de conditionnement
      // en faisant un cas particulier pour le type Benne qui s'exprime en m3
      // Exemple  GRV 30l ou Benne 20m3
      const volume = packagings[0].volume;
      conditionnement = [
        conditionnement,
        packagings[0].other,
        ...(volume
          ? [
              type === "BENNE"
                ? `${new Decimal(volume).dividedBy(1000)}m3`
                : `${volume}l`
            ]
          : [])
      ]
        .filter(Boolean)
        .join(" ");
    }

    return { quantity: totalQuantity, conditionnement };
  });

  return packagingsRows;
}
