import React from "react";
import { useQuery } from "@apollo/client";
import { Loader, List, ListItem } from "common/components";
import { Query } from "generated/graphql/types";
import gql from "graphql-tag";
import styles from "./AccountOauth2AppList.module.scss";
import { generatePath, useHistory } from "react-router";
import routes from "common/routes";

export const ApplicationFragment = gql`
  fragment ApplicationFragment on Application {
    id
    name
    logoUrl
    redirectUris
    clientSecret
  }
`;

export const APPLICATIONS = gql`
  query GetApplications {
    applications {
      ...ApplicationFragment
    }
  }
  ${ApplicationFragment}
`;

export default function AccountOAuth2AppList() {
  const { data, loading } = useQuery<Pick<Query, "applications">>(APPLICATIONS);

  const history = useHistory();

  if (loading) {
    return <Loader />;
  }

  if (data) {
    return (
      <div className={styles.Applications}>
        {data.applications.map(application => (
          <div className="panel" key={application.id}>
            <div key={application.id} className={styles.Application}>
              <div className={styles.ApplicationLogo}>
                <img
                  src={application.logoUrl}
                  alt=""
                  width="100"
                  height="100"
                />
              </div>
              <div className={styles.ApplicationDetails}>
                <p>
                  <strong>{application.name}</strong>
                </p>
                <p>Client id : {application.id}</p>
                <p>Client secret : {application.clientSecret}</p>
                <p>URLs de redirection :</p>
                <List>
                  {application.redirectUris.map((redirectUri, index) => (
                    <ListItem key={index}>{redirectUri}</ListItem>
                  ))}
                </List>
              </div>
              <button
                className="btn btn--primary"
                onClick={() =>
                  history.push(
                    generatePath(routes.account.oauth2.edit, {
                      id: application.id,
                    })
                  )
                }
              >
                Modifier
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
