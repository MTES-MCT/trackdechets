import React from "react";
export const FillFieldsInfo = () => (
  <p className="notification notification--warning">
    Veuillez vous assurer que les champs mis en valeur soient remplis afin de
    pouvoir signer
  </p>
);
export const DisabledFieldsInfo = () => (
  <p className="notification notification--warning">
    Les champs grisés ci-dessous ont été scellés via signature et ne sont plus
    modifiables.
  </p>
);
