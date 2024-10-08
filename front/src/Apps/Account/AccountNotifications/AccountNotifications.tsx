import React from "react";
import { Table } from "@codegouvfr/react-dsfr/Table";
import AccountCompanyNotificationsTableCell from "./AccountCompanyNotificationsTableCell";
import { AccountCompanyNotifications } from "./AccounCompanyNotifications";
import AccountCompanyNotificationsUpdateButton from "./AccountCompanyNotificationsUpdateButton";
import SearchableCompaniesList from "../../Companies/CompaniesList/SearchableCompaniesList";
import AccountNotificationsUpdateAllButton from "./AccountNotificationsUpdateAllButton";
import Alert from "@codegouvfr/react-dsfr/Alert";

const alertDescription =
  "Il est impératif de veiller à ce qu'au moins un membre de votre établissement" +
  " soit inscrit à chacune des alertes. Trackdéchets n'a pas la possibilité" +
  " de désigner automatiquement un responsable ni de gérer ces inscriptions." +
  " Il est donc de votre responsabilité de vous assurer que les alertes sont" +
  " bien configurées et suivies.";

export default function AccountNotifications() {
  return (
    <div>
      <Alert
        severity="warning"
        title=""
        description={alertDescription}
        style={{ marginBottom: 20 }}
      />
      <SearchableCompaniesList
        renderCompanies={(companies, totalCount) => (
          <Table
            fixed
            data={companies.map(company => [
              AccountCompanyNotificationsTableCell({ company }),
              AccountCompanyNotifications({ company }),
              AccountCompanyNotificationsUpdateButton({ company })
            ])}
            headers={[
              "Établissements",
              "Notifications",
              <AccountNotificationsUpdateAllButton totalCount={totalCount} />
            ]}
          />
        )}
      />
    </div>
  );
}
