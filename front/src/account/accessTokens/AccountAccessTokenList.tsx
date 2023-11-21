import React, { useState } from "react";
import { DEVELOPERS_DOCUMENTATION_URL } from "../../common/config";
import { useQuery } from "@apollo/client";
import { NewAccessToken, Query } from "codegen-ui";
import { Loader } from "../../Apps/common/Components";
import { NotificationError } from "../../Apps/common/Components/Error/Error";
import AccountContentWrapper from "../AccountContentWrapper";
import AccountAccessToken from "./AccountAccessToken";
import { ACCESS_TOKENS } from "./queries";
import AccountAccessTokenCreate from "./AccountAccessTokenCreate";
import AccountNewAccessToken from "./AccountNewAccessToken";
import AccountAccessTokenRevokeAll from "./AccountAccessTokenRevokeAll";

export default function AccountAccessTokenList() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [newAccessToken, setNewAccessToken] = useState<NewAccessToken | null>(
    null
  );

  return (
    <AccountContentWrapper
      title="Mes jetons d'accès personnels"
      button={
        <div className="tw-flex">
          <button
            className="btn btn--primary"
            onClick={() => {
              setIsGenerating(true);
            }}
          >
            Générer un nouveau jeton d'accès
          </button>
          <div className="tw-pr-2" />
          <button
            className="btn btn--danger"
            onClick={() => {
              setIsRevokingAll(true);
            }}
          >
            Révoquer tous les jetons d'accès
          </button>
        </div>
      }
    >
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
      {isRevokingAll && (
        <AccountAccessTokenRevokeAll
          onClose={() => setIsRevokingAll(false)}
          onRevokeAll={() => setNewAccessToken(null)}
        />
      )}
    </AccountContentWrapper>
  );
}

type AccountAccessTokenListContentProps = {
  newAccessToken: NewAccessToken | null;
  onNewAccessTokenDelete: () => void;
};

function AccountAccessTokenListContent({
  newAccessToken,
  onNewAccessTokenDelete
}: AccountAccessTokenListContentProps) {
  const { loading, error, data } =
    useQuery<Pick<Query, "accessTokens">>(ACCESS_TOKENS);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <NotificationError apolloError={error} />;
  }

  if (data) {
    return (
      <div className="tw-mb-4">
        <div className="tw-mb-4">
          Jetons d'accès personnels que vous pouvez utiliser pour vous
          authentifier à{" "}
          <a
            href={DEVELOPERS_DOCUMENTATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-underline"
          >
            l'API Trackdéchets
          </a>
          .
        </div>

        {newAccessToken && (
          <AccountNewAccessToken
            accessToken={newAccessToken}
            onDelete={() => onNewAccessTokenDelete()}
          />
        )}

        {data.accessTokens.map(accessToken => (
          <AccountAccessToken key={accessToken.id} accessToken={accessToken} />
        ))}

        {data.accessTokens.length === 0 && !newAccessToken && (
          <div>Vous n'avez aucun jeton d'accès.</div>
        )}
      </div>
    );
  }

  return null;
}
