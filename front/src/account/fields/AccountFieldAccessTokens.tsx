import React from "react";
import { gql, useMutation, Reference } from "@apollo/client";
import copyToClipboard from "copy-to-clipboard";
import { format } from "date-fns";
import fr from "date-fns/locale/fr";
import { AccessToken, Mutation } from "generated/graphql/types";
import { accessTokenFragment } from "common/fragments";
import { IconDelete1, IconCopyPaste } from "common/components/Icons";
import { parseDate } from "common/datetime";
import styles from "./AccountFieldAccessTokens.module.scss";

const REVOKE_PERSONAL_ACCESS_TOKEN = gql`
  mutation RevokeAccessToken($id: ID!) {
    revokeAccessToken(id: $id) {
      ...AccessTokenFragment
    }
  }
  ${accessTokenFragment}
`;

interface AccountFieldAccessTokensProps {
  accessTokens: AccessToken[];
}

export default function AccountFieldAccessTokens({
  accessTokens,
}: AccountFieldAccessTokensProps) {
  const [revokeAccessToken] = useMutation<Pick<Mutation, "revokeAccessToken">>(
    REVOKE_PERSONAL_ACCESS_TOKEN,
    {
      update: (cache, { data }) => {
        const accessToken = data?.revokeAccessToken;

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
    }
  );

  return (
    <ul className={styles.list}>
      {accessTokens.map(accessToken => (
        <li key={accessToken.token} className={styles.listItem}>
          <div className={styles.listItemContent}>
            <div className={styles.listItemToken}>{accessToken.token}</div>
            <small className={styles.listItemLastUsed}>
              Dernière utilisation :{" "}
              {accessToken.lastUsed
                ? `le ${format(parseDate(accessToken.lastUsed), "d MMMM yyyy", {
                    locale: fr,
                  })}`
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
                  revokeAccessToken({
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
  );
}
