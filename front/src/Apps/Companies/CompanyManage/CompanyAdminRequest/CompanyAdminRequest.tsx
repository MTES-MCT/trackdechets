import React, { useState } from "react";
import styles from "../../../Account/AccountContentWrapper.module.scss";
import Button from "@codegouvfr/react-dsfr/Button";
import { CompanyCreateAdminRequestModal } from "./CompanyCreateAdminRequestModal/CompanyCreateAdminRequestModal";

export const CompanyAdminRequest = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <div className={`fr-container--fluid ${styles.content}`}>
      <div className={`fr-mb-4w ${styles.panelTitle}`}>
        <div className={styles.titles}>
          <h1 className="fr-h3 fr-mb-n0-5v">
            Demander les droits administrateur
          </h1>
        </div>
      </div>
      <div>
        <p className="fr-mb-4w">
          Vous vous retrouvez dans une situation dans laquelle, l'administrateur
          Trackdéchets de votre établissement n'est plus actif pour diverses
          raisons (ex: départ sans accès à son compte, et sans avoir nommé un
          autre admin).
        </p>

        <p className="fr-mb-4w">
          Vous disposez des droits de l'établissement concerné pour demander le
          rôle d'administrateur.
        </p>

        <p className="fr-mb-4w">
          Cette nouvelle fonctionnalité va vous aider dans cette démarche, tout
          en maintenant un niveau de sécurité et de confidentialité. Selon les
          situations, cette demande peut être rapide, mais peut aussi entrainer
          l'envoi d'un courrier au siège du SIRET concerné pour nous assurer de
          la relation entre le demandeur et l'établissement. Retrouvez les{" "}
          <a
            href="TODO"
            className="force-external-link-content force-underline-link"
          >
            détails de la procédure en FAQ
          </a>
          .
        </p>
      </div>

      <Button
        onClick={async () => {
          setIsModalOpen(true);
        }}
        iconId="fr-icon-arrow-right-line"
        iconPosition="right"
      >
        Demander les droits administrateur
      </Button>

      <CompanyCreateAdminRequestModal
        onClose={() => {
          setIsModalOpen(false);
        }}
        isOpen={isModalOpen}
      />
    </div>
  );
};
