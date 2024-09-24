import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { Loader } from "../../../common/Components";
import { NotificationError } from "../../../common/Components/Error/Error";
import { Application, ApplicationGoal, Query } from "@td/codegen-ui";
import { MY_APPLICATIONS } from "./queries";
import AccountApplicationsMyApplicationDelete from "./AccountApplicationsMyApplicationsDelete";
import AccountApplicationsMyApplicationCreateUpdate from "./AccountApplicationsMyApplicationsCreateUpdate";

function AccountApplicationMyApplicationsRow({
  myApplication,
  setApplicationToDelete,
  setApplicationToUpdate
}) {
  const [isRowOpen, setIsRowOpen] = useState(false);

  const redirectUris = uris => {
    const count = uris.length;

    return `${uris[0]}${
      count > 1 ? ` et ${count - 1} autre${count > 2 ? "s" : ""}` : ""
    }`;
  };

  return (
    <>
      <tr key={myApplication.id} data-row-key={myApplication.id}>
        <td>
          <button
            className={`fr-btn fr-btn--tertiary-no-outline ${
              isRowOpen
                ? "fr-icon-arrow-down-s-line"
                : "fr-icon-arrow-right-s-line"
            }`}
            onClick={() => {
              setIsRowOpen(previousState => !previousState);
            }}
          ></button>
        </td>
        <td>{myApplication.name}</td>
        <td>
          {myApplication.goal === ApplicationGoal.Personnal
            ? "Entreprise"
            : myApplication.goal === ApplicationGoal.Clients
            ? "Client"
            : "Non défini"}
        </td>
        <td className="fr-col--sm">
          {redirectUris(myApplication.redirectUris)}
        </td>
        <td style={{ whiteSpace: "nowrap" }}>
          <button
            className="fr-btn fr-btn--secondary fr-mr-1w"
            onClick={() => {
              setApplicationToUpdate(myApplication);
            }}
          >
            Modifier
          </button>
          <button
            className="fr-btn fr-btn--secondary"
            onClick={() => {
              setApplicationToDelete(myApplication);
            }}
          >
            Supprimer
          </button>
        </td>
      </tr>
      <tr
        id={`info${myApplication.id}`}
        key={`info${myApplication.id}`}
        data-row-key={`info${myApplication.id}`}
        className={`${isRowOpen ? "" : "fr-hidden"}`}
      >
        <td colSpan={1}></td>
        <td colSpan={11}>
          <p className="fr-text--sm">
            {!!myApplication.logoUrl && (
              <img
                src={myApplication.logoUrl}
                alt="Logo"
                width="40"
                height="40"
              />
            )}
            Client ID : {myApplication.id}
            <br />
            Client secret : {myApplication.clientSecret}
            <br />
            URLs de redirection :
          </p>
          <ul
            style={{
              listStyle: "disc",
              paddingLeft: "16px"
            }}
          >
            {myApplication.redirectUris.map((redirectUri, index) => (
              <li key={index}>{redirectUri}</li>
            ))}
          </ul>
        </td>
      </tr>
    </>
  );
}

export default function AccountApplicationsMyApplications() {
  const [applicationToDelete, setApplicationToDelete] =
    useState<Application | null>(null);
  const [isCreatingApplication, setIsCreatingApplication] = useState(false);
  const [applicationToUpdate, setApplicationToUpdate] =
    useState<Application | null>(null);

  const { data, loading, error } =
    useQuery<Pick<Query, "myApplications">>(MY_APPLICATIONS);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <NotificationError apolloError={error} />;
  }

  return (
    <>
      {!!applicationToDelete && (
        <AccountApplicationsMyApplicationDelete
          application={applicationToDelete}
          onClose={() => setApplicationToDelete(null)}
        />
      )}
      {!!applicationToUpdate && (
        <AccountApplicationsMyApplicationCreateUpdate
          application={applicationToUpdate}
          onClose={() => setApplicationToUpdate(null)}
        />
      )}
      {!!isCreatingApplication && (
        <AccountApplicationsMyApplicationCreateUpdate
          onClose={() => setIsCreatingApplication(false)}
        />
      )}
      <h3 className="fr-h3">Mes applications tierces</h3>
      <div
        className="fr-table fr-table--lg"
        id="table-my-applications-component"
      >
        <div className="fr-table__header">
          <p className="fr-table__detail">
            Vous avez {data?.myApplications.length || 0} application(s)
          </p>
          <ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-md fr-btns-group--icon-left">
            <li>
              <button
                className="fr-btn"
                onClick={() => {
                  setIsCreatingApplication(true);
                }}
              >
                Créer une application
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
                    <th scope="col"></th>
                    <th scope="col">Nom de l'application</th>
                    <th className="fr-col--sm" scope="col">
                      Gestion de
                    </th>
                    <th className="fr-col--sm" scope="col">
                      URL(s) de redirection
                    </th>
                    <th className="fr-col" scope="col"></th>
                  </tr>
                </thead>
                <tbody>
                  {data?.myApplications.map(myApplication => (
                    <AccountApplicationMyApplicationsRow
                      key={`row${myApplication.id}`}
                      myApplication={myApplication}
                      setApplicationToDelete={setApplicationToDelete}
                      setApplicationToUpdate={setApplicationToUpdate}
                    ></AccountApplicationMyApplicationsRow>
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
