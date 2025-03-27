import React from "react";
import Alert from "@codegouvfr/react-dsfr/Alert";

export const UploadYourSirenePDFInfo = () => {
  return (
    <Alert
      title="Etablissement non diffusible"
      severity="info"
      description={
        <span>
          Le SIRET renseigné correspond à celui d'une entreprise anonyme. Afin
          de procéder à sa création dans Trackdéchets, nous vous invitons à
          télécharger un certificat d'inscription au répertoire des entreprises
          datant de moins de trois mois. Pour télécharger votre certificat, RDV
          sur{" "}
          <a
            className="fr-link force-external-link-content force-underline-link"
            href="https://avis-situation-sirene.insee.fr/"
            target="_blank"
            rel="noreferrer"
          >
            https://avis-situation-sirene.insee.fr/
          </a>
        </span>
      }
    />
  );
};
