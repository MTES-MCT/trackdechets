import React from "react";

const PACKAGINGS_NAMES = {
  BOITE_CARTON: "Caisse en carton avec sac en plastique",
  FUT: "Fûts ou jerrican à usage unique",
  BOITE_PERFORANTS: "Boîtes et Mini-collecteurs pour déchets perforants",
  GRAND_EMBALLAGE: "Grand emballage",
  GRV: "Grand récipient pour vrac",
  AUTRE: "Autre"
};

export function PackagingInfosTable({ packagingInfos }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Nbre</th>
          <th>Contenant</th>
          <th>Volume Unitaire</th>
          <th>Volume Total</th>
        </tr>
      </thead>
      <tbody>
        {packagingInfos.map((row, index) => (
          <tr key={index}>
            <td>{row.quantity}</td>
            <td>{PACKAGINGS_NAMES[row.type]}</td>
            <td>{row.volume}</td>
            <td>{row.quantity * row.volume}</td>
          </tr>
        ))}
        <tr>
          <td>
            <strong>
              {packagingInfos.reduce((total, packaging) => {
                return total + (packaging.quantity ?? 0);
              }, 0) || null}
            </strong>
          </td>
          <td colSpan={2}>
            <strong>Totaux en litres</strong>
          </td>
          <td>
            {" "}
            {packagingInfos.reduce((total, packaging) => {
              return (
                total + (packaging.quantity ?? 0) * (packaging.volume ?? 0)
              );
            }, 0) || null}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
