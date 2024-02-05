import * as React from "react";

export const Quantity = ({ label, weight }) => {
  if (!weight) {
    return null;
  }
  const hasEstimate = [false, true].includes(weight?.isEstimate);
  return (
    <p>
      <strong>{label} : </strong>
      {weight?.value ?? ""} kg{" "}
      {hasEstimate && (
        <>
          <input
            type="checkbox"
            checked={weight?.isEstimate === false}
            readOnly
          />{" "}
          Réelle{" "}
          <input
            type="checkbox"
            checked={weight?.isEstimate === true}
            readOnly
          />{" "}
          Estimée
        </>
      )}
    </p>
  );
};
