import React from "react";
import Alert from "@codegouvfr/react-dsfr/Alert";

export const InvalidSirenePDFFormatError = () => {
  return (
    <Alert
      title="Le certificat d'inscription doit être au format PDF"
      severity="error"
      description={
        <span>
          Le fichier que vous tentez de charger n'est pas au format PDF.
          Veuillez vérifier le format du fichier et réessayer avec un fichier
          PDF valide. Pour plus d'informations, veuillez consulter{" "}
          <a
            href="https://faq.trackdechets.fr/inscription-et-gestion-de-compte/questions-frequentes#lors-de-la-creation-de-mon-etablissement-non-diffusible-mon-fichier-na-pas-ete-valide.-que-faire"
            target="_blank"
            rel="noreferrer"
            className="fr-link"
          >
            cet article sur la foire aux questions Trackdéchets
          </a>
        </span>
      }
    />
  );
};
