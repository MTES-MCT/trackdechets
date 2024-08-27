import React from "react";
import { useQuery } from "@apollo/client";
import { Loader } from "../../common/Components";
import { Query } from "@td/codegen-ui";
import AccountOauth2App from "./AccountOauth2App";
import { MY_APPLICATIONS } from "./queries";
import AccountContentWrapper from "../AccountContentWrapper";
import { Link } from "react-router-dom";
import routes from "../../routes";

export default function AccountOAuth2AppList() {
  const { data, loading } =
    useQuery<Pick<Query, "myApplications">>(MY_APPLICATIONS);

  if (loading) {
    return <Loader />;
  }

  const content =
    data && data.myApplications.length > 0 ? (
      <div className="tw-mt-4">
        {data.myApplications.map(application => (
          <AccountOauth2App key={application.id} application={application} />
        ))}
      </div>
    ) : (
      <div>Aucune application</div>
    );

  return (
    <AccountContentWrapper
      title="Mes applications tierces"
      additional={
        <Link className="btn btn--primary" to={routes.account.oauth2.create}>
          Créer une application tierce
        </Link>
      }
    >
      {content}
    </AccountContentWrapper>
  );
}
