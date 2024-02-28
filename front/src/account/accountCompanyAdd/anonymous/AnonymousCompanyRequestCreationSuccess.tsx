import React from "react";
import Alert from "@codegouvfr/react-dsfr/Alert";

export const AnonymousCompanyRequestCreationSuccess = () => {
  return (
    <Alert
      title="Demande de création de l'établissement confirmée"
      severity="success"
      description={
        <span>
          Votre demande de création d'établissement a bien été prise en compte,
          nous reviendrons vers vous dans les plus brefs délais.
        </span>
      }
    />
  );
};
