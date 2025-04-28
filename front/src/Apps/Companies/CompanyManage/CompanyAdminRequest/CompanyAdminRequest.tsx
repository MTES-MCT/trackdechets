import React, { useState } from "react";
import styles from "../../../Account/AccountContentWrapper.module.scss";
import Button from "@codegouvfr/react-dsfr/Button";
import { CompanyCreateAdminRequestModal } from "./CompanyCreateAdminRequestModal/CompanyCreateAdminRequestModal";
import { CompanyAdminRequestsTable } from "./CompanyAdminRequestsTable";
import { AcceptMailAdminRequestModal } from "./AcceptMailAdminRequestModal";

export const CompanyAdminRequest = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAcceptMailModalOpen, setIsAcceptMailModalOpen] = useState(false);

  return (
    <div className={`fr-container--fluid ${styles.content}`}>
      <div className="fr-mb-4w">
        <div className={`fr-mb-2w ${styles.panelTitle}`}>
          <div className={styles.titles}>
            <h1 className="fr-h3 fr-mb-n0-5v">
              Demander les droits administrateur
            </h1>
          </div>
        </div>
        <div>
          <p className="fr-mb-4w">
            Vous vous retrouvez dans une situation dans laquelle,
            l'administrateur Trackdéchets de votre établissement n'est plus
            actif pour diverses raisons (par exemple, départ sans avoir nommé de
            nouvel administrateur).
          </p>

          <p className="fr-mb-4w">
            Vous disposez des droits de l'établissement concerné pour demander
            le rôle d'administrateur.
          </p>

          <p className="fr-mb-4w">
            Cette fonctionnalité va vous aider dans cette démarche, tout en
            maintenant un niveau de sécurité et de confidentialité. Selon les
            situations, cette demande peut être rapide, mais peut aussi
            entraîner l'envoi d'un courrier au siège du SIRET concerné pour nous
            assurer de la relation entre le demandeur et l'établissement.
            Retrouvez les{" "}
            <a
              href="https://faq.trackdechets.fr/inscription-et-gestion-de-compte/gerer-son-compte/modifier-les-informations-de-son-compte#option-3-si-ladministrateur-est-inactif-et-que-loption-2-ne-fonctionne-pas"
              target="_blank"
              rel="noopener noreferrer"
              className="fr-link force-external-link-content force-underline-link"
            >
              détails de la procédure en FAQ
            </a>
            .
          </p>

          <Button
            onClick={async () => {
              setIsCreateModalOpen(true);
            }}
            iconId="fr-icon-arrow-right-line"
            iconPosition="right"
          >
            Demander les droits administrateur
          </Button>
        </div>
      </div>

      <div className={`fr-mb-4w ${styles.panelTitle}`}>
        <div className={styles.titles}>
          <h3 className="fr-h5 fr-mb-n0-5v">Suivi de mes demandes</h3>
        </div>
      </div>
      <div>
        <CompanyAdminRequestsTable />
      </div>

      <CompanyCreateAdminRequestModal
        onClose={() => {
          setIsCreateModalOpen(false);
        }}
        isOpen={isCreateModalOpen}
      />

      <div>
        <Button
          priority="secondary"
          onClick={() => {
            setIsAcceptMailModalOpen(true);
          }}
          iconId="fr-icon-mail-line"
          iconPosition="right"
        >
          Saisir un code reçu par courrier
        </Button>
      </div>

      <AcceptMailAdminRequestModal
        isOpen={isAcceptMailModalOpen}
        onClose={() => {
          setIsAcceptMailModalOpen(false);
        }}
      />
    </div>
  );
};
