import React from "react";
export const FillFieldsInfo = () => (
  <p className="notification notification--warning">
    Veuillez vous assurer que les champs mis en valeur soient remplis afin de
    pouvoir signer
  </p>
);
export const DisabledFieldsInfo = () => (
  <p className="notification notification--warning">
    Les champs grisés ci-dessous ne sont plus modifiables parce qu'ils ont été
    scellés via signature ou que ce bordereau est inclus dans une opération de
    synthèse ou de regroupement.
  </p>
);
