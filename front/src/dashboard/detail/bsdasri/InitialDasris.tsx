import React from "react";
import { formatDate } from "common/datetime";
export const InitialDasris = ({ initialBsdasris }) => {
  if (!initialBsdasris?.length) {
    return <div>Aucun bordereau associé</div>;
  }
  return (
    <table className="td-table">
      <thead>
        <tr className="td-table__head-tr">
          <th>Id</th>
          <th>Quantité</th>
          <th>Volume</th>
          <th>Poids</th>
          <th>Date d'enlèvement</th>
          <th>Code postal</th>
        </tr>
      </thead>
      <tbody>
        {initialBsdasris.map(el => (
          <tr key={el.id}>
            <td>{el.id}</td>
            <td>{el.quantity}</td>
            <td>{el.volume}</td>
            <td>{el.weight}</td>
            <td>{formatDate(el.takenOverAt)}</td>
            <td>{el.postalCode}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
