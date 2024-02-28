import React from "react";
import Alert from "@codegouvfr/react-dsfr/Alert";

export const InvalidSirenePDFFormatError = () => {
  return (
    <Alert
      title="Le certificat d'inscription doit être au format PDF"
      severity="error"
      description={
        <span>
          Le fichier que vous tentez de télécharger n'est pas au format PDF.
          Veuillez vérifier le format du fichier et réessayer avec un fichier
          PDF valide. Pour plus d'informations, veuillez contacter l'assistance
          Trackdéchets : contact@trackdechets.beta.gouv.fr
        </span>
      }
    />
  );
};
