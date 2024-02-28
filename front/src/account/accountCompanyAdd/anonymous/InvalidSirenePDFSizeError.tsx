import React from "react";
import Alert from "@codegouvfr/react-dsfr/Alert";

export const InvalidSirenePDFSizeError = () => {
  return (
    <Alert
      title="Le fichier chargé doit faire moins de 500Ko"
      severity="error"
      description={
        <span>
          Le fichier que vous tentez de charger est trop lourd. Veuillez
          réessayer avec un fichier PDF conforme. Pour plus d'informations,
          veuillez contacter l'assistance Trackdéchets :
          contact@trackdechets.beta.gouv.fr
        </span>
      }
    />
  );
};
