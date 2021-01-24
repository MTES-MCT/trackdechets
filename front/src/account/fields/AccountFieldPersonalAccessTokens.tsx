import React from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import { Mutation, Query } from "generated/graphql/types";
import { accessTokenFragment } from "common/fragments";
import ToolTip from "common/components/Tooltip";
import styles from "./AccountField.module.scss";
import AccountFieldAccessTokens from "./AccountFieldAccessTokens";

const GET_PERSONAL_ACCESS_TOKENS = gql`
  query GetPersonalAccessTokens {
    personalAccessTokens {
      ...AccessTokenFragment
    }
  }
  ${accessTokenFragment}
`;

const CREATE_PERSONAL_ACCESS_TOKEN = gql`
  mutation CreatePersonalAccessToken {
    createPersonalAccessToken {
      ...AccessTokenFragment
    }
  }
  ${accessTokenFragment}
`;

export default function AccountFieldPersonalAccessTokens() {
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
              fragment: accessTokenFragment,
            });
            return [...existingPersonalAccessTokens, newPersonalAccessToken];
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
      <div className={styles.field__value}>
        <AccountFieldAccessTokens
          accessTokens={data?.personalAccessTokens ?? []}
        />
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
