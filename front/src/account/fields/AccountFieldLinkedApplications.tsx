import React from "react";
import { gql, useQuery } from "@apollo/client";
import { Query } from "generated/graphql/types";
import { accessTokenFragment } from "common/fragments";
import ToolTip from "common/components/Tooltip";
import baseStyles from "./AccountField.module.scss";
import styles from "./AccountFieldLinkedApplications.module.scss";
import AccountFieldAccessTokens from "./AccountFieldAccessTokens";

const ApplicationFragment = gql`
  fragment ApplicationFragment on Application {
    id
    name
    logoUrl
    accessTokens {
      ...AccessTokenFragment
    }
  }
  ${accessTokenFragment}
`;

const GET_LINKED_APPLICATIONS = gql`
  query GetLinkedApplications {
    linkedApplications {
      ...ApplicationFragment
    }
  }
  ${ApplicationFragment}
`;

export default function AccountFieldFieldLinkedApplications() {
  const { data } = useQuery<Pick<Query, "linkedApplications">>(
    GET_LINKED_APPLICATIONS
  );

  return (
    <div className={baseStyles.field}>
      <label>
        Applications{" "}
        <ToolTip msg="Ces applications peuvent s'authentifier à l'API Trackdéchets en votre nom" />
      </label>
      <div className={baseStyles.field__value}>
        <ul className={styles.list}>
          {data?.linkedApplications.map(application => (
            <li key={application.id} className={styles.listItem}>
              <article className={styles.application}>
                <div className={styles.applicationLogo}>
                  {application.logoUrl ? (
                    <img
                      src={application.logoUrl}
                      alt=""
                      width="40"
                      height="40"
                    />
                  ) : (
                    <div className={styles.applicationLogoAvatar}>
                      {application.name
                        .split(" ")
                        .map(word => word.charAt(0))
                        .join("")
                        .toUpperCase()}
                    </div>
                  )}
                </div>
                <div className={styles.applicationName}>{application.name}</div>
              </article>
              <AccountFieldAccessTokens
                accessTokens={application.accessTokens}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
