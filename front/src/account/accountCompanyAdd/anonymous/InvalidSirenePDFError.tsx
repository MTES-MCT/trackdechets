import React from "react";
import Alert from "@codegouvfr/react-dsfr/Alert";

export const InvalidSirenePDFError = ({
  errorMessage
}: {
  errorMessage: string;
}) => {
  return (
    <Alert
      title={errorMessage}
      severity="error"
      description={
        <span>
          Le fichier que vous tentez de télécharger comporte une erreur.
          Veuillez vérifier le fichier et réessayer avec un fichier PDF valide.
          Pour plus d'informations, veuillez contacter l'assistance Trackdéchets
          : contact@trackdechets.beta.gouv.fr
        </span>
      }
    />
  );
};
