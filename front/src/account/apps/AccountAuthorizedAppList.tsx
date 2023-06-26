import { useQuery } from "@apollo/client";
import { Loader } from "Apps/common/Components";
import { NotificationError } from "Apps/common/Components/Error/Error";
import { Query } from "generated/graphql/types";
import React from "react";
import AccountAuthorizedApp from "./AccountAuthorizedApp";
import { AUTHORIZED_APPLICATIONS } from "./queries";

export default function AccountAuthorizedAppList() {
  const { data, error, loading } = useQuery<
    Pick<Query, "authorizedApplications">
  >(AUTHORIZED_APPLICATIONS);

  if (loading) {
    return <Loader />;
  }

  if (data) {
    if (data.authorizedApplications.length === 0) {
      return <div>Vous n'avez donné accès à aucune application</div>;
    }

    return (
      <div>
        <div>
          Vous avez donné accès à {data.authorizedApplications.length}{" "}
          {data.authorizedApplications.length > 1
            ? "applications"
            : "application"}
        </div>
        {data.authorizedApplications.map((app, idx) => (
          <AccountAuthorizedApp key={idx} authorizedApplication={app} />
        ))}
      </div>
    );
  }

  if (error) {
    return <NotificationError apolloError={error} />;
  }

  return null;
}
