import React, { useState } from "react";
import copyTextToClipboard from "copy-text-to-clipboard";
import { IconCheckCircle1, IconCopyPaste } from "common/components/Icons";
import { NewAccessToken } from "generated/graphql/types";
import AccountAccessTokenRevoke from "./AccountAccessTokenRevoke";
import styles from "./AccountAccessToken.module.scss";

type AccountNewAccessTokenProps = {
  accessToken: NewAccessToken;
  onDelete: () => void;
};

export default function AccountNewAccessToken({
  accessToken,
  onDelete,
}: AccountNewAccessTokenProps) {
  const [isRevoking, setIsRevoking] = useState(false);

  return (
    <>
      <div className="notification success">
        Un nouveau jeton d'accès a été généré ! Pensez à le copier maintenant.
        Vous ne serez plus en mesure de le consulter ultérieurement.
      </div>
      <div className={`${styles.token} ${styles.newToken}`}>
        <div className={styles.newTokenGroupItems}>
          <IconCheckCircle1 className={styles.checkIcon} />
          <span>{accessToken.token}</span>
          <IconCopyPaste
            className={styles.copyToClipboardIcon}
            onClick={() => {
              copyTextToClipboard(accessToken.token);
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
