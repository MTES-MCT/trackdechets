import React from "react";
import { DEVELOPERS_DOCUMENTATION_URL } from "common/config";
import AccountFieldApiKey from "../fields/AccountFieldApiKey";
import { gql, useQuery } from "@apollo/client";
import { Query } from "generated/graphql/types";
import { Loader } from "common/components";
import { NotificationError } from "common/components/Error";
import AccountAccessToken from "./AccountAccessToken";
import { ACCESS_TOKENS } from "./queries";

export default function AccountAccessTokenList() {
  const { loading, error, data } = useQuery<Pick<Query, "accessTokens">>(
    ACCESS_TOKENS
  );

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <NotificationError apolloError={error} />;
  }

  if (data) {
    return (
      <div>
        <div>
          Jeton d'accès personnels que vous pouvez utiliser pour vous
          authentifier à{" "}
          <a className="tw-underline" href={DEVELOPERS_DOCUMENTATION_URL}>
            l'API Trackdéchets
          </a>
        </div>
        <div>
          {data.accessTokens.map(accessToken => (
            <AccountAccessToken accessToken={accessToken} />
          ))}
        </div>
        <AccountFieldApiKey />
      </div>
    );
  }

  return null;
}
