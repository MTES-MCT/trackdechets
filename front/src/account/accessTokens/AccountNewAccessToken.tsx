import React, { useState } from "react";
import copyTextToClipboard from "copy-text-to-clipboard";
import {
  IconCheckCircle1,
  IconCopyPaste
} from "../../Apps/common/Components/Icons/Icons";
import { NewAccessToken } from "codegen-ui";
import AccountAccessTokenRevoke from "./AccountAccessTokenRevoke";
import styles from "./AccountAccessToken.module.scss";
import { DEVELOPERS_DOCUMENTATION_URL } from "../../common/config";

type AccountNewAccessTokenProps = {
  accessToken: NewAccessToken;
  onDelete: () => void;
};

export default function AccountNewAccessToken({
  accessToken,
  onDelete
}: AccountNewAccessTokenProps) {
  const [isRevoking, setIsRevoking] = useState(false);

  return (
    <>
      <div className="notification success">
        <p>
          Un nouveau jeton d'accès a été généré ! Pensez à le copier maintenant.
          Vous ne serez plus en mesure de le consulter ultérieurement.
        </p>
        <strong>
          <span role="img" aria-label="emoji light">
            🚨
          </span>{" "}
          Ce jeton est confidentiel, ne le diffusez pas, et consultez nos{" "}
          <a
            href={`${DEVELOPERS_DOCUMENTATION_URL}/tutoriels/quickstart/access-token`}
            target="_blank"
            rel="noreferrer"
          >
            recommandations de sécurité{" "}
          </a>
          dans la documentation.
        </strong>
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
