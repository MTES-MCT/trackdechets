import React from "react";
import { Table } from "@codegouvfr/react-dsfr/Table";
import CompanyDisplay from "./CompanyDisplay";
import { NotificationsDisplay } from "./NotificationsDisplay";
import NotificationsUpdateButton from "./NotificationsUpdateButton";
import SearchableCompaniesList from "../../Companies/CompaniesList/SearchableCompaniesList";
import Alert from "@codegouvfr/react-dsfr/Alert";
import styles from "./AccountNotifications.module.scss";

const alertDescription =
  "Il est impératif de veiller à ce qu'au moins un membre de vos établissements" +
  " soit inscrit à chacune des notifications. Trackdéchets n'a pas la possibilité" +
  " de désigner automatiquement un responsable ni de gérer ces inscriptions." +
  " Il est donc de votre responsabilité de vous assurer que les notifications sont" +
  " bien configurées et suivies.";

/**
 * Ce composant permet l'affichage de la liste des établissements
 * de l'utilisateur et des notifications actives sur chaque établissement.
 * Pour chaque établissement un bouton permet d'ouvrir une modale afin de modifier
 * les préfèrences de notifications de l'utilisateur au sein de cet établissement.
 */
export default function AccountNotifications() {
  return (
    <div>
      <Alert
        severity="warning"
        title=""
        description={alertDescription}
        className="fr-mb-4w"
      />
      {/* Liste paginée des établissements avec un bouton "Charger plus" 
      et une barre de recherche */}
      <SearchableCompaniesList
        renderCompanies={(companies, _totalCount) => (
          <Table
            fixed
            data={companies.map(company => [
              <CompanyDisplay company={company} />,
              <NotificationsDisplay company={company} />,
              <div className={styles.alignRight}>
                <NotificationsUpdateButton company={company} />
              </div>
            ])}
            headers={["Établissements", "Notifications", ""]}
          />
        )}
      />
    </div>
  );
}
