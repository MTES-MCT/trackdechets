import React from "react";
import { gql, useQuery, useMutation, Reference } from "@apollo/client";
import copyToClipboard from "copy-to-clipboard";
import { formatDistanceToNow } from "date-fns";
import fr from "date-fns/locale/fr";
import { Mutation, Query } from "generated/graphql/types";
import { IconDelete1, IconCopyPaste } from "common/components/Icons";
import ToolTip from "common/components/Tooltip";
import { parseDate } from "common/datetime";
import baseStyles from "./AccountField.module.scss";
import styles from "./AccountFieldApiKey.module.scss";

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
    <div className={baseStyles.field}>
      <label>
        Clés d'API{" "}
        <ToolTip msg="Ces clés peuvent être utilisées pour s'authentifier à l'API Trackdéchets" />
      </label>
      <div>
        <ul className={styles.list}>
          {data?.personalAccessTokens.map(accessToken => (
            <li key={accessToken.token} className={styles.listItem}>
              <div className={styles.listItemContent}>
                <div className={styles.listItemToken}>{accessToken.token}</div>
                <small className={styles.listItemLastUsed}>
                  Dernière utilisation :{" "}
                  {accessToken.lastUsed
                    ? formatDistanceToNow(parseDate(accessToken.lastUsed), {
                        locale: fr,
                      })
                    : "jamais"}
                </small>
              </div>
              <div className={styles.listItemActions}>
                <button
                  type="button"
                  className="btn btn--outline-primary"
                  onClick={() => {
                    copyToClipboard(accessToken.token);
                  }}
                >
                  Copier <IconCopyPaste style={{ marginLeft: "0.5rem" }} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Êtes-vous sûr de vouloir révoquer cette clé ?\n\nIl ne sera plus possible de l'utiliser pour s'authentifier à votre compte Trackdéchets."
                      )
                    ) {
                      revokePersonalAccessToken({
                        variables: { id: accessToken.id },
                      });
                    }
                  }}
                  className="btn btn--outline-danger"
                >
                  <IconDelete1 />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => {
            createPersonalAccessToken();
          }}
          className="btn btn--primary"
        >
          Générer une clé
        </button>
      </div>
    </div>
  );
}
