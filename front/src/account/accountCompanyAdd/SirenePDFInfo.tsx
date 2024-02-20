import React from "react";
import Alert from "@codegouvfr/react-dsfr/Alert";

const SirenePDFInfo = () => {
  return (
    <Alert
      title="Etablissement non diffusible"
      severity="info"
      description={
        <>
          <span>
            Nous n'avons pas pu récupérer les informations de cet établissement
            car il n'est pas diffusible. Veuillez uploader votre certificat
            d'inscription au répertoire des Entreprises et des Établissements
            (SIRENE) de moins de 3 mois pour pouvoir procéder à la création de
            l'établissement. Pour télécharger votre certificat, RDV sur{" "}
          </span>
          <a
            href="https://avis-situation-sirene.insee.fr/"
            target="_blank"
            rel="noreferrer"
          >
            https://avis-situation-sirene.insee.fr/
          </a>
        </>
      }
    />
  );
};

export default SirenePDFInfo;
