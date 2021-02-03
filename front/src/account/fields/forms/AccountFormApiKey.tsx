import React from "react";
import { IconCopyPaste } from "common/components/Icons";
import styles from "./AccountForm.module.scss";

type Props = {
  apiKey: string;
};

export default function AccountFormApiKey({ apiKey }: Props) {
  const copyApiKeyToClipboard = () => {
    const apiKeyRef = document.querySelector("#apiKey") as HTMLInputElement;
    apiKeyRef.select();
    document.execCommand("copy");
  };

  return (
    <div className="form__row">
      <div className={styles.input__group}>
        <input
          id="apiKey"
          type="text"
          className={`td-input ${styles.input}`}
          value={apiKey}
          readOnly
        />
        <IconCopyPaste
          className={styles.icon}
          onClick={copyApiKeyToClipboard}
        />
      </div>
    </div>
  );
}
