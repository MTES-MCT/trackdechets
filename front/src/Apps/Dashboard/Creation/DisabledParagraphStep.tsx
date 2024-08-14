import Alert from "@codegouvfr/react-dsfr/Alert";
import React from "react";

const DisabledParagraphStep = () => (
  <Alert
    description="Les champs grisés ci-dessous ont été scellés via signature et ne sont plus modifiables."
    severity="info"
    small
    className="fr-mb-2w"
  />
);

export default DisabledParagraphStep;
