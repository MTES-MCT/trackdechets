import React from "react";
import styles from "./AccountForm.module.scss";
import { FaCopy } from "react-icons/fa";

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
        <FaCopy className={styles.icon} onClick={copyApiKeyToClipboard} />
      </div>
    </div>
  );
}
