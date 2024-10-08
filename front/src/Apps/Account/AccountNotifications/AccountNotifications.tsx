import React from "react";
import { Table } from "@codegouvfr/react-dsfr/Table";
import AccountCompany from "./AccountCompany";
import { AccountCompanyNotifications } from "./AccounCompanyNotifications";
import AccountCompanyNotificationsUpdateButton from "./AccountCompanyNotificationsUpdateButton";
import SearchableCompaniesList from "../../Companies/CompaniesList/SearchableCompaniesList";

export default function AccountNotifications() {
  return (
    <SearchableCompaniesList
      renderCompanies={companies => (
        <Table
          fixed
          data={companies.map(company => [
            AccountCompany({ company }),
            AccountCompanyNotifications({ company }),
            AccountCompanyNotificationsUpdateButton({ company })
          ])}
          headers={["Établissements", "Notifications", <div></div>]}
        />
      )}
    />
  );
}
