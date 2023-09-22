import React, { useState } from "react";
import { List, ListItem } from "../../common/components";
import styles from "./AccountOauth2App.module.scss";
import { generatePath, useHistory } from "react-router";
import routes from "../../Apps/routes";
import { Application, ApplicationGoal } from "codegen-ui";
import AccountOauth2AppDelete from "./AccountOauth2AppDelete";

type AccountOauth2AppProps = {
  application: Application;
};

export default function AccountOauth2App({
  application
}: AccountOauth2AppProps) {
  const history = useHistory();

  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <div className="panel" key={application.id}>
      <div className={styles.Application}>
        <div className={styles.ApplicationLogo}>
          <img
            src={application.logoUrl || ""}
            alt="Logo Application"
            width="100"
            height="100"
          />
        </div>
        <div className={styles.ApplicationDetails}>
          <p>
            <strong>{application.name}</strong>
          </p>
          <p>
            Cette application gère les données de :{" "}
            {application.goal === ApplicationGoal.Personnal
              ? "Votre propre entreprise"
              : application.goal === ApplicationGoal.Clients
              ? "Vos clients"
              : "Non défini. Veuillez mettre à jour cette information à partir du bouton Modifier"}
          </p>
          <p>Client id : {application.id}</p>
          <p>Client secret : {application.clientSecret}</p>
          <p>URLs de redirection :</p>
          <List>
            {application.redirectUris.map((redirectUri, index) => (
              <ListItem key={index}>{redirectUri}</ListItem>
            ))}
          </List>
        </div>
        <div>
          <button
            className="btn btn--primary tw-mr-2"
            onClick={() =>
              history.push(
                generatePath(routes.account.oauth2.edit, {
                  id: application.id
                })
              )
            }
          >
            Modifier
          </button>
          <button
            className="btn btn--danger"
            onClick={() => setIsDeleting(true)}
          >
            Supprimer
          </button>
        </div>
      </div>
      {isDeleting && (
        <AccountOauth2AppDelete
          application={application}
          onClose={() => setIsDeleting(false)}
        />
      )}
    </div>
  );
}
