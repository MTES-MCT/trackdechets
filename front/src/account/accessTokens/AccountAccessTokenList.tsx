import React, { useState } from "react";
import { DEVELOPERS_DOCUMENTATION_URL } from "common/config";
import { gql, useQuery } from "@apollo/client";
import { NewAccessToken, Query } from "generated/graphql/types";
import { Loader } from "common/components";
import { NotificationError } from "common/components/Error";
import AccountAccessToken from "./AccountAccessToken";
import { ACCESS_TOKENS } from "./queries";
import AccountAccessTokenCreate from "./AccountAccessTokenCreate";
import AccountNewAccessToken from "./AccountNewAccessToken";

export default function AccountAccessTokenList() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [newAccessToken, setNewAccessToken] = useState<NewAccessToken | null>(
    null
  );

  return (
    <div className="tw-px-1 tw-py-2">
      <div className="tw-flex tw-justify-between tw-flex-start">
        <h5 className="h5 tw-font-bold tw-mb-4">
          Mes jetons d'accès personnels
        </h5>
        <button
          className="btn btn--primary"
          onClick={() => {
            setIsGenerating(true);
          }}
        >
          Générer un nouveau jeton d'accès
        </button>
      </div>
      <AccountAccessTokenListContent
        newAccessToken={newAccessToken}
        onNewAccessTokenDelete={() => setNewAccessToken(null)}
      />
      {isGenerating && (
        <AccountAccessTokenCreate
          onClose={newToken => {
            setNewAccessToken(newToken);
            setIsGenerating(false);
          }}
        />
      )}
    </div>
  );
}

type AccountAccessTokenListContentProps = {
  newAccessToken: NewAccessToken | null;
  onNewAccessTokenDelete: () => void;
};

function AccountAccessTokenListContent({
  newAccessToken,
  onNewAccessTokenDelete,
}: AccountAccessTokenListContentProps) {
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
        <div className="tw-mb-5">
          Jeton d'accès personnels que vous pouvez utiliser pour vous
          authentifier à{" "}
          <a className="tw-underline" href={DEVELOPERS_DOCUMENTATION_URL}>
            l'API Trackdéchets
          </a>
        </div>

        {newAccessToken && (
          <AccountNewAccessToken
            accessToken={newAccessToken}
            onDelete={() => onNewAccessTokenDelete()}
          />
        )}
        <div>
          {data.accessTokens.map(accessToken => (
            <AccountAccessToken accessToken={accessToken} />
          ))}
        </div>
      </div>
    );
  }

  return null;
}
