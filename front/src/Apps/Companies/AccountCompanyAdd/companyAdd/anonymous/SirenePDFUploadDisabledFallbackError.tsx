import React from "react";
import styles from "../../AccountCompanyAdd.module.scss";
import Alert from "@codegouvfr/react-dsfr/Alert";

export const SirenePDFUploadDisabledFallbackError = () => (
  <div className={styles.alertWrapper}>
    <Alert
      title="Etablissement non diffusible"
      severity="error"
      description={
        <>
          <span>
            Nous n'avons pas pu récupérer les informations de cet établissement
            car il n'est pas diffusible. Veuillez nous contacter via{" "}
            <a
              className="fr-link force-external-link-content force-underline-link"
              href="https://faq.trackdechets.fr/pour-aller-plus-loin/assistance"
              target="_blank"
              rel="noreferrer"
            >
              la FAQ
            </a>{" "}
            <b>avec</b> votre certificat d'inscription au répertoire des
            Entreprises et des Établissements (SIRENE) pour pouvoir procéder à
            la création de l'établissement. Pour télécharger votre certificat,
            RDV sur{" "}
          </span>
          <a
            className="fr-link force-external-link-content force-underline-link"
            href="https://avis-situation-sirene.insee.fr/"
            target="_blank"
            rel="noreferrer"
          >
            https://avis-situation-sirene.insee.fr/
          </a>
        </>
      }
    />
  </div>
);
