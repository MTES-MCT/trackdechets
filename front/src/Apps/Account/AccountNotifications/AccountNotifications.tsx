import React from "react";
import { MY_COMPANIES } from "../../Companies/common/queries";
import { Query } from "@td/codegen-ui";
import { useQuery } from "@apollo/client";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { Loader } from "../../common/Components";
import AccountCompany from "./AccountCompany";
import { AccountCompanyNotifications } from "./AccounCompanyNotifications";
import AccountCompanyNotificationsUpdateButton from "./AccountCompanyNotificationsUpdateButton";

export default function AccountNotifications() {
  const { data, loading, error, refetch, fetchMore } = useQuery<
    Pick<Query, "myCompanies">
  >(MY_COMPANIES, { fetchPolicy: "network-only", variables: { first: 10 } });

  if (data) {
    return (
      <Table
        fixed
        data={data.myCompanies.edges.map(c => [
          AccountCompany({ company: c.node }),
          AccountCompanyNotifications({ company: c.node }),
          AccountCompanyNotificationsUpdateButton({ company: c.node })
        ])}
        headers={["Établissements", "Notifications", <div></div>]}
      />
    );
  }

  if (loading) {
    return <Loader />;
  }

  return null;
}
