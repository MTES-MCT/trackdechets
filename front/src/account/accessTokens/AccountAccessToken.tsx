import {
  AccessToken,
  Mutation,
  MutationRevokeAccessTokenArgs,
} from "generated/graphql/types";
import React, { useState } from "react";
import { format } from "date-fns";
import { gql, useMutation } from "@apollo/client";
import { REVOKE_ACCESS_TOKEN } from "./queries";
import AccountAccessTokenRevoke from "./AccountAccessTokenRevoke";

type AccountAccessTokenProps = {
  accessToken: AccessToken;
};

export default function AccountAccessToken({
  accessToken,
}: AccountAccessTokenProps) {
  const [isRevoking, setIsRevoking] = useState(false);

  return (
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
      <button
        className="btn btn--danger"
        onClick={() => {
          setIsRevoking(true);
        }}
      >
        Supprimer
      </button>
      {isRevoking && (
        <AccountAccessTokenRevoke
          accessToken={accessToken}
          onClose={() => setIsRevoking(false)}
        />
      )}
    </div>
  );
}
