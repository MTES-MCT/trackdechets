import React from "react";
import zxcvbn from "zxcvbn";
import { Alert } from "@codegouvfr/react-dsfr/Alert";

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
          Veuillez suivre les conseils ci-dessus.`,
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
  return <Alert title={title} description={message} severity={hintType} />;
}

export const PassWordHints = () => (
  <div className="fr-messages-group" aria-live="assertive">
    <p className="fr-mb-1w fr-text--bold">
      <span className="bold">Votre mot de passe doit </span>: <br />
    </p>
    <p className="fr-text--md fr-mb-1w">
      - contenir {MIN_LENGTH} caractères minimum
      <br />
      - avoir une complexité suffisante
      <br />
      Nous vous recommandons d'utiliser une phrase de passe (plusieurs mots
      accolés) ou un gestionnaire de mots de passe
    </p>
  </div>
);
