import React from "react";
import { DEVELOPERS_DOCUMENTATION_URL } from "common/config";
import AccountFieldApiKey from "./fields/AccountFieldApiKey";
import { gql, useQuery } from "@apollo/client";
import { Query } from "generated/graphql/types";
import { Loader } from "common/components";
import { NotificationError } from "common/components/Error";
import { format } from "date-fns";

const ACCESS_TOKENS = gql`
  {
    accessTokens {
      description
      lastUsed
      tokenPreview
    }
  }
`;

export default function AccountIntegrationApi() {
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
            <div className="panel tw-flex tw-justify-between">
              <div>
                <div>{accessToken.tokenPreview}</div>
                <div>{accessToken.description}</div>
                <div>
                  {accessToken.lastUsed
                    ? `Utilisé pour la dernière fois le ${format(
                        new Date(accessToken.lastUsed),
                        "dd/MM/yyyy"
                      )}`
                    : `Jamais utilisé`}{" "}
                </div>
              </div>
              <button className="btn btn--danger">Supprimer</button>
            </div>
          ))}
        </div>
        <AccountFieldApiKey />
      </div>
    );
  }

  return null;
}
