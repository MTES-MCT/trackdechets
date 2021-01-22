import React from "react";
import { gql, useQuery, useMutation, Reference } from "@apollo/client";
import { formatDistanceToNow } from "date-fns";
import fr from "date-fns/locale/fr";
import { Mutation, Query } from "generated/graphql/types";
import ToolTip from "common/components/Tooltip";
import { parseDate } from "common/datetime";
import styles from "./AccountField.module.scss";

const AccessTokenFragment = gql`
  fragment AccessTokenFragment on AccessToken {
    id
    token
    lastUsed
  }
`;

const GET_PERSONAL_ACCESS_TOKENS = gql`
  query GetPersonalAccessTokens {
    personalAccessTokens {
      ...AccessTokenFragment
    }
  }
  ${AccessTokenFragment}
`;

const CREATE_PERSONAL_ACCESS_TOKEN = gql`
  mutation CreatePersonalAccessToken {
    createPersonalAccessToken {
      ...AccessTokenFragment
    }
  }
  ${AccessTokenFragment}
`;

const REVOKE_PERSONAL_ACCESS_TOKEN = gql`
  mutation RevokePersonalAccessToken($id: ID!) {
    revokePersonalAccessToken(id: $id) {
      ...AccessTokenFragment
    }
  }
  ${AccessTokenFragment}
`;

export default function AccountFieldApiKey() {
  const { data } = useQuery<Pick<Query, "personalAccessTokens">>(
    GET_PERSONAL_ACCESS_TOKENS
  );
  const [createPersonalAccessToken] = useMutation<
    Pick<Mutation, "createPersonalAccessToken">
  >(CREATE_PERSONAL_ACCESS_TOKEN, {
    update: (cache, { data }) => {
      const accessToken = data?.createPersonalAccessToken;

      if (accessToken == null) {
        return;
      }

      cache.modify({
        fields: {
          personalAccessTokens(existingPersonalAccessTokens = []) {
            const newPersonalAccessToken = cache.writeFragment({
              data: accessToken,
              fragment: AccessTokenFragment,
            });
            return [...existingPersonalAccessTokens, newPersonalAccessToken];
          },
        },
      });
    },
  });
  const [revokePersonalAccessToken] = useMutation<
    Pick<Mutation, "revokePersonalAccessToken">
  >(REVOKE_PERSONAL_ACCESS_TOKEN, {
    update: (cache, { data }) => {
      const accessToken = data?.revokePersonalAccessToken;

      if (accessToken == null) {
        return;
      }

      cache.modify({
        fields: {
          personalAccessTokens(
            existingPersonalAccessTokens: Reference[] = [],
            { readField }
          ) {
            return existingPersonalAccessTokens.filter(
              existingAccessToken =>
                readField("id", existingAccessToken) !== accessToken.id
            );
          },
        },
      });
    },
  });

  return (
    <div className={styles.field}>
      <label>
        Clés d'API{" "}
        <ToolTip msg="Ces clés peuvent être utilisées pour s'authentifier à l'API Trackdéchets" />
      </label>
      <ul>
        {data?.personalAccessTokens.map(accessToken => (
          <li key={accessToken.token}>
            <p>{accessToken.token}</p>
            <p>
              Dernière utilisation :{" "}
              {accessToken.lastUsed
                ? formatDistanceToNow(parseDate(accessToken.lastUsed), {
                    locale: fr,
                  })
                : "jamais"}
            </p>
            <button
              type="button"
              onClick={() => {
                revokePersonalAccessToken({
                  variables: { id: accessToken.id },
                });
              }}
            >
              Supprimer
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() => {
              createPersonalAccessToken();
            }}
          >
            Générer une clé
          </button>
        </li>
      </ul>
    </div>
  );
}
