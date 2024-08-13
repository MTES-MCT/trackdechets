import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { DEVELOPERS_DOCUMENTATION_URL } from "../../../../common/config";
import { AccessToken, Query } from "@td/codegen-ui";
import { Loader } from "../../../common/Components";
import { NotificationError } from "../../../common/Components/Error/Error";
import { format } from "date-fns";
import { ACCESS_TOKENS } from "./queries";
import AccountApplicationsAccessTokenRevokeAll from "./AccountApplicationsAccessTokensRevokeAll";
import AccountApplicationsAccessTokenCreate from "./AccountApplicationsAccessTokensCreate";
import AccountApplicationsAccessTokenRevoke from "./AccountApplicationsAccessTokenRevoke";

export default function AccountApplicationsAccessTokens() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [tokenToRevoke, setTokenToRevoke] = useState<AccessToken | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const { loading, error, data } =
    useQuery<Pick<Query, "accessTokens">>(ACCESS_TOKENS);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <NotificationError apolloError={error} />;
  }

  return (
    <>
      {isGenerating && (
        <AccountApplicationsAccessTokenCreate
          onClose={() => {
            setIsGenerating(false);
          }}
        />
      )}
      {isRevokingAll && (
        <AccountApplicationsAccessTokenRevokeAll
          onClose={() => setIsRevokingAll(false)}
        />
      )}
      {!!tokenToRevoke && (
        <AccountApplicationsAccessTokenRevoke
          accessToken={tokenToRevoke}
          onClose={() => {
            setTokenToRevoke(null);
          }}
        />
      )}
      <h3 className="fr-h3">Gérer les jetons d'accès à l'API</h3>
      <div className="fr-table fr-table--lg" id="table-access-tokens-component">
        <div className="fr-table__header">
          <p className="fr-table__detail">
            {data?.accessTokens.length || 0} jeton(s) d'accès
          </p>
          <ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-md fr-btns-group--icon-left">
            <li>
              <button
                className="fr-btn"
                onClick={() => {
                  setIsGenerating(true);
                }}
              >
                Créer un jeton
              </button>
            </li>
            <li>
              <button
                className="fr-btn fr-btn--secondary"
                onClick={() => {
                  setIsRevokingAll(true);
                }}
              >
                Révoquer tous les jetons
              </button>
            </li>
          </ul>
        </div>
        <div className="fr-table__wrapper">
          <div className="fr-table__container">
            <div className="fr-table__content">
              <table id="table-access-tokens">
                <thead>
                  <tr>
                    <th className="fr-col--lg" scope="col">
                      Description
                    </th>
                    <th className="fr-col--sm" scope="col">
                      Dernière utilisation
                    </th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.accessTokens.map(accessToken => (
                    <tr key={accessToken.id} data-row-key={accessToken.id}>
                      <td>{accessToken.description}</td>
                      <td>
                        {accessToken.lastUsed
                          ? format(new Date(accessToken.lastUsed), "dd/MM/yyyy")
                          : `Jamais utilisé`}{" "}
                      </td>
                      <td>
                        <button
                          className="fr-btn fr-btn--secondary"
                          onClick={() => setTokenToRevoke(accessToken)}
                        >
                          Révoquer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div>
        <a
          href={DEVELOPERS_DOCUMENTATION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="fr-link"
        >
          Découvrir l'utilisation des jetons d'accès à l'API Trackdéchets
        </a>
      </div>
    </>
  );
}
