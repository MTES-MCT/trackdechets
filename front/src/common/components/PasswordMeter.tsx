import React from "react";
import zxcvbn from "zxcvbn";
import { IconLockShield } from "common/components/Icons";
import styles from "./PasswordMeter.module.scss";

type Props = {
  password: string;
};

export default function PasswordMeter({ password }: Props) {
  if (!password) return <span />;

  const { score } = zxcvbn(password);

  return (
    <span className={styles.passwordMeter}>
      <IconLockShield />{" "}
      <span>Difficulté du mot de passe: {createPasswordLabel(score)}</span>
    </span>
  );
}

function createPasswordLabel(score: number): string {
  switch (score) {
    case 0:
      return "Très faible";
    case 1:
      return "Faible";
    case 2:
      return "Correct";
    case 3:
      return "Bon";
    case 4:
      return "Très bon";
    default:
      return "Faible";
  }
}
