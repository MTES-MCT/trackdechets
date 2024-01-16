import { AccessToken } from "@td/codegen-ui";
import React, { useState } from "react";
import { format } from "date-fns";
import AccountAccessTokenRevoke from "./AccountAccessTokenRevoke";
import styles from "./AccountAccessToken.module.scss";

type AccountAccessTokenProps = {
  accessToken: AccessToken;
};

export default function AccountAccessToken({
  accessToken
}: AccountAccessTokenProps) {
  const [isRevoking, setIsRevoking] = useState(false);

  return (
    <div className={styles.token}>
      <div>
        <div>
          <span>*********************</span>
          {accessToken.description && <span> - {accessToken.description}</span>}
        </div>
        <div className={styles.lastUsed}>
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
        Révoquer
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
