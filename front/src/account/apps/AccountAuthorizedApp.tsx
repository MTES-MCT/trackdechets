import { formatDate } from "../../common/datetime";
import { AuthorizedApplication } from "@td/codegen-ui";
import React, { useState } from "react";
import styles from "./AccountAuthorizedApp.module.scss";
import AccountAuthorizedAppRevoke from "./AccountAuthorizedAppRevoke";

type AccountAuthorizedApplicationProps = {
  authorizedApplication: AuthorizedApplication;
};

export default function AccountAuthorizedApp({
  authorizedApplication
}: AccountAuthorizedApplicationProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <div className="panel" key={authorizedApplication.id}>
      <div className={styles.Application}>
        <div className={styles.ApplicationLogo}>
          <img
            src={authorizedApplication.logoUrl || ""}
            alt="Logo Application"
          />
        </div>
        <div className={styles.ApplicationDetails}>
          <h2 className="h5">{authorizedApplication.name}</h2>
          <div>
            {authorizedApplication.lastConnection ? (
              <span>
                Dernière connexion le{" "}
                {formatDate(authorizedApplication.lastConnection)}
              </span>
            ) : (
              <span>Jamais utilisé</span>
            )}{" "}
            {authorizedApplication.admin && (
              <span> - Administré par {authorizedApplication.admin}</span>
            )}
          </div>
        </div>
        <button className="btn btn--danger" onClick={() => setIsDeleting(true)}>
          Révoquer l'accès
        </button>
      </div>
      {isDeleting && (
        <AccountAuthorizedAppRevoke
          authorizedApplication={authorizedApplication}
          onClose={() => setIsDeleting(false)}
        />
      )}
    </div>
  );
}
