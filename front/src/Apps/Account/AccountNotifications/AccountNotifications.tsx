import React from "react";
import { Table } from "@codegouvfr/react-dsfr/Table";
import CompanyDisplay from "./CompanyDisplay";
import { NotificationsDisplay } from "./NotificationsDisplay";
import NotificationsUpdateButton from "./NotificationsUpdateButton";
import SearchableCompaniesList from "../../Companies/CompaniesList/SearchableCompaniesList";
import Alert from "@codegouvfr/react-dsfr/Alert";

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
        style={{ marginBottom: 20 }}
      />
      {/* Liste paginée des établissements avec un bouton "Charger plus" 
      et une barre de recherche */}
      <SearchableCompaniesList
        renderCompanies={(companies, _totalCount) => (
          <Table
            fixed
            data={companies.map(company => [
              CompanyDisplay({ company }),
              NotificationsDisplay({ company }),
              NotificationsUpdateButton({ company })
            ])}
            headers={["Établissements", "Notifications", ""]}
          />
        )}
      />
    </div>
  );
}
