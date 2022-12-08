import React from "react";
import zxcvbn from "zxcvbn";
import { Alert } from "@dataesr/react-dsfr";
type Props = {
  password: string;
};

const MIN_LENGTH = 10;
const MIN_SCORE = 3;

type PasswordHintResult = {
  title: string;
  message: string;
  hintType: "error" | "success";
};
const getPasswordHint = (password: string): PasswordHintResult => {
  if (password.length < MIN_LENGTH)
    return {
      title: "Trop court",
      hintType: "error",
      message: `Votre mot de passe est trop court (${password.length} caractères), la longueur minimale est de 10 caractères`,
    };
  const { score } = zxcvbn(password);
  return score >= MIN_SCORE
    ? {
        title: "Parfait",
        hintType: "success",
        message: "Votre mot de passe est robuste",
      }
    : {
        title: "Insuffisant",
        hintType: "error",
        message: `Votre mot de passe est trop simple, ajoutez de la diversité dans les caractères. 
          Utiliser de préférence une phrase de passe ou un outil de gestion de mot de passe`,
      };
};
export default function PasswordHelper({ password }: Props) {
  return (
    <>
      <PassWordHints />
      <PasswordMeter password={password} />
    </>
  );
}
export function PasswordMeter({ password }: Props) {
  if (!password) return <span />;
  const { title, hintType, message } = getPasswordHint(password);
  return <Alert title={title} description={message} type={hintType} />;
}

export const PassWordHints = () => (
  <div className="fr-messages-group" aria-live="assertive">
    <p className="fr-message">Votre mot de passe doit :</p>
    <p className="fr-message fr-message--info">
      - contenir {MIN_LENGTH} caractères minimum
    </p>
    <p className="fr-message fr-message--info">
      - avoir une complexité suffisante{" "}
    </p>
    <p className="fr-message fr-message--info">
      Nous vous recommandons d'utiliser une phrase de passe (plusieurs mots
      accolés) ou un gestionnaire de mots de passe
    </p>
  </div>
);
