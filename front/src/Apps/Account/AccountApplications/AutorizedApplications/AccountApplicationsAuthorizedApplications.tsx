import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { Loader } from "../../../common/Components";
import { NotificationError } from "../../../common/Components/Error/Error";
import { Query, AuthorizedApplication } from "@td/codegen-ui";
import { AUTHORIZED_APPLICATIONS } from "./queries";
import { format } from "date-fns";
import AccountApplicationsAuthorizedApplicationsRevoke from "./AccountApplicationsAuthorizedApplicationsRevoke";

export default function AccountApplicationsAuthorizedApplications() {
  const [applicationToRevoke, setApplicationToRevoke] =
    useState<AuthorizedApplication | null>(null);

  const { data, error, loading } = useQuery<
    Pick<Query, "authorizedApplications">
  >(AUTHORIZED_APPLICATIONS);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <NotificationError apolloError={error} />;
  }

  return (
    <>
      {!!applicationToRevoke && (
        <AccountApplicationsAuthorizedApplicationsRevoke
          authorizedApplication={applicationToRevoke}
          onClose={() => {
            setApplicationToRevoke(null);
          }}
        />
      )}
      <h3 className="fr-h3">Gérer les applications autorisées</h3>
      <div
        className="fr-table fr-table--lg"
        id="table-authorized-applications-component"
      >
        <div className="fr-table__header">
          <p className="fr-table__detail">
            Vous avez donné accès à {data?.authorizedApplications.length || 0}{" "}
            application(s)
          </p>
        </div>
        <div className="fr-table__wrapper">
          <div className="fr-table__container">
            <div className="fr-table__content">
              <table id="table-access-tokens">
                <thead>
                  <tr>
                    <th scope="col">Nom de l'application</th>
                    <th className="fr-col--sm" scope="col">
                      Dernière utilisation
                    </th>
                    <th scope="col">Administré par</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.authorizedApplications.map(authorizedApplication => (
                    <tr
                      key={authorizedApplication.id}
                      data-row-key={authorizedApplication.id}
                    >
                      <td>{authorizedApplication.name}</td>
                      <td>
                        {authorizedApplication.lastConnection
                          ? format(
                              new Date(authorizedApplication.lastConnection),
                              "dd/MM/yyyy"
                            )
                          : `Jamais utilisé`}{" "}
                      </td>
                      <td>{authorizedApplication.admin}</td>
                      <td>
                        <button
                          className="fr-btn fr-btn--secondary"
                          onClick={() =>
                            setApplicationToRevoke(authorizedApplication)
                          }
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
    </>
  );
}
