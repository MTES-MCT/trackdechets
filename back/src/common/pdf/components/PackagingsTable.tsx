import React from "react";
import {
  BsdaPackaging,
  BsdaPackagingType,
  PackagingInfo,
  Packagings
} from "@td/codegen-back";
import { pluralize } from "@td/constants";
import Decimal from "decimal.js";

type PackagingsTableProps = {
  packagings: PackagingInfo[] | BsdaPackaging[];
};

function PackagingsTable({ packagings }: PackagingsTableProps) {
  const packagingsRows = getPackagingsRows(packagings);
  return (
    <table>
      <thead>
        <tr>
          <th>Conditionnement</th>
          <th>Nombre</th>
        </tr>
      </thead>
      <tbody>
        {packagingsRows.map(({ quantity, packagingsLabel }, idx) => (
          <tr key={idx}>
            <td>{packagingsLabel}</td>
            <td>{quantity}</td>
          </tr>
        ))}
        {packagingsRows.length > 1 && (
          <tr key={packagingsRows.length}>
            <td>
              <b>TOTAL</b>
            </td>
            <td>
              {packagingsRows.reduce((total, p) => total + p.quantity, 0)}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

const packagingTypeLabels: Record<Packagings | BsdaPackagingType, string> = {
  BENNE: "Benne",
  CITERNE: "Citerne",
  FUT: "Fût",
  GRV: "Grand Récipient Vrac (GRV)",
  AUTRE: "Autre",
  PIPELINE: "Pipeline",
  BIG_BAG: "Big Bag / GRV",
  CONTENEUR_BAG: "Conteneur-bag",
  DEPOT_BAG: "Dépôt-bag",
  PALETTE_FILME: "Palette filmée",
  SAC_RENFORCE: "Sac renforcé",
  OTHER: "Autre"
};

/**
 * Permet de calculer les lignes du tableau de conditionnement <PackagingInfosTable />
 */
export function getPackagingsRows(
  packagingInfos: PackagingInfo[] | BsdaPackaging[]
) {
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

    let packagingsLabel: string = pluralize(
      packagingTypeLabels[type],
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
      packagingsLabel = [
        packagingsLabel,
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
      packagingsLabel = [
        packagingsLabel,
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

    return { quantity: totalQuantity, packagingsLabel };
  });

  return packagingsRows;
}

export default PackagingsTable;
