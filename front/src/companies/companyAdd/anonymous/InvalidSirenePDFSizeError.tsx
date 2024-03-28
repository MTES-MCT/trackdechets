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
          veuillez consulter cet article :
          https://faq.trackdechets.fr/inscription-et-gestion-de-compte/questions-frequentes#lors-de-la-creation-de-mon-etablissement-non-diffusible-mon-fichier-na-pas-ete-valide.-que-faire
        </span>
      }
    />
  );
};
