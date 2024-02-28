import React from "react";
import Alert from "@codegouvfr/react-dsfr/Alert";

export const AlreadyPendingAnonymousCompanyRequestInfo = () => {
  return (
    <Alert
      title="Demande de création de l'établissement en cours"
      severity="info"
      description={
        <span>
          Le SIRET renseigné correspond à celui d'une entreprise anonyme pour
          lequel une demande de création d'établissement est en cours. Pour plus
          d'informations, veuillez contacter l'assistance Trackdéchets :
          contact@trackdechets.beta.gouv.fr
        </span>
      }
    />
  );
};
