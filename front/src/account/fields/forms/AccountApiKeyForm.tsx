import React, { useRef } from "react";
import styles from "./AccountForm.module.scss";
import { FaCopy } from "react-icons/fa";

type Props = {
  apiKey: string;
};

export default function AccountApiKeyForm({ apiKey }: Props) {
  const copyApiKeyToClipboard = () => {
    const apiKeyRef = document.querySelector("#apiKey") as HTMLInputElement;
    apiKeyRef.select();
    document.execCommand("copy");
  };

  return (
    <div className="form__group">
      <div className={styles.input__group}>
        <input
          id="apiKey"
          type="text"
          className={styles.input}
          value={apiKey}
          readOnly
        />
        <FaCopy className={styles.icon} onClick={copyApiKeyToClipboard} />
      </div>
    </div>
  );
}
