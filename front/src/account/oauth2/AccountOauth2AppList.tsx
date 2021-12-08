import React from "react";
import { useQuery } from "@apollo/client";
import { Loader } from "common/components";
import { Query } from "generated/graphql/types";
import AccountOauth2App from "./AccountOauth2App";
import { APPLICATIONS } from "./queries";

export default function AccountOAuth2AppList() {
  const { data, loading } = useQuery<Pick<Query, "applications">>(APPLICATIONS);

  if (loading) {
    return <Loader />;
  }

  if (data) {
    return (
      <div className="tw-mt-4">
        {data.applications.map(application => (
          <AccountOauth2App application={application} />
        ))}
      </div>
    );
  }

  return null;
}
