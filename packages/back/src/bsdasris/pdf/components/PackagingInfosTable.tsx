import React from "react";
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
            <td>{row.type}</td>
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
