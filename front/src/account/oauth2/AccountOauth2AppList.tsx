import React from "react";
import { useQuery } from "@apollo/client";
import { Loader } from "Apps/common/Components";
import { Query } from "generated/graphql/types";
import AccountOauth2App from "./AccountOauth2App";
import { MY_APPLICATIONS } from "./queries";

export default function AccountOAuth2AppList() {
  const { data, loading } =
    useQuery<Pick<Query, "myApplications">>(MY_APPLICATIONS);

  if (loading) {
    return <Loader />;
  }

  if (data && data.myApplications.length > 0) {
    return (
      <div className="tw-mt-4">
        {data.myApplications.map(application => (
          <AccountOauth2App key={application.id} application={application} />
        ))}
      </div>
    );
  }

  return <div>Aucune application</div>;
}
