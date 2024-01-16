import * as React from "react";

export const Quantity = ({ label, weight }) => (
  <p>
    <strong>{label} : </strong>
    {weight?.value ?? ""} kg{" "}
    <input type="checkbox" checked={weight?.isEstimate === false} readOnly />{" "}
    Réelle{" "}
    <input type="checkbox" checked={weight?.isEstimate === true} readOnly />{" "}
    Estimée
  </p>
);
