import React from "react";
import Alert from "@codegouvfr/react-dsfr/Alert";

const InvalidSirenePDFError = ({ errorMessage }: { errorMessage: string }) => {
  return (
    <Alert
      title={errorMessage}
      severity="error"
      description={
        <>
          <span>
            Veuillez nous contacter via{" "}
            <a
              href="https://faq.trackdechets.fr/pour-aller-plus-loin/assistance"
              target="_blank"
              rel="noreferrer"
            >
              la FAQ
            </a>{" "}
            <b>avec</b> votre certificat d'inscription au répertoire des
            Entreprises et des Établissements (SIRENE) de moins de 3 mois pour
            pouvoir procéder à la création de l'établissement. Pour télécharger
            votre certificat, RDV sur{" "}
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

export default InvalidSirenePDFError;
