import { IconCheckCircle1, IconCopyPaste } from "common/components/Icons";
import { NewAccessToken } from "generated/graphql/types";
import React, { useState } from "react";
import styles from "./AccountAccessToken.module.scss";
import AccountAccessTokenRevoke from "./AccountAccessTokenRevoke";

type AccountNewAccessTokenProps = {
  accessToken: NewAccessToken;
  onDelete: () => void;
};

export default function AccountNewAccessToken({
  accessToken,
  onDelete,
}: AccountNewAccessTokenProps) {
  const [isRevoking, setIsRevoking] = useState(false);

  const copyTokenToClipboard = () => {
    var copyText = document.getElementById("newToken");
    var tmpTextArea = document.createElement("textarea");
    tmpTextArea.value = copyText?.textContent ?? "";
    document.body.appendChild(tmpTextArea);
    tmpTextArea.select();
    document.execCommand("Copy");
    tmpTextArea.remove();
  };

  return (
    <>
      <div className="notification success">
        Un nouveau jeton d'accès a été généré ! Pensez à le copier maintenant.
        Vous ne serez plus en mesure de le consulter ultérieurement.
      </div>
      <div className={`${styles.token} ${styles.newToken}`}>
        <div className={styles.newTokenGroupItems}>
          <IconCheckCircle1 className={styles.checkIcon} />
          <span id="newToken">{accessToken.token}</span>
          <IconCopyPaste
            className={styles.copyToClipboardIcon}
            onClick={() => {
              if (navigator.clipboard) {
                // navigator.clipboard not available in local if using a host different than localhost (ex: trackdechets.local)
                navigator.clipboard.writeText(accessToken.token);
              } else {
                copyTokenToClipboard();
              }
            }}
          />
        </div>

        <button
          className="btn btn--danger"
          onClick={() => {
            setIsRevoking(true);
          }}
        >
          Supprimer
        </button>
        {isRevoking && (
          <AccountAccessTokenRevoke
            accessToken={{ id: accessToken.id }}
            onClose={() => setIsRevoking(false)}
            onDelete={onDelete}
          />
        )}
      </div>
    </>
  );
}
