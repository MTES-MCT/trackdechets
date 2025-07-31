import React, { useState, useEffect } from "react";
import { zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core";
import { Alert } from "@codegouvfr/react-dsfr/Alert";

type Props = {
  password: string;
};

export const MIN_LENGTH = 12;
const MIN_SCORE = 3;
const CHAR_CLASSES_REGEX = {
  lower: /[a-z]/,
  upper: /[A-Z]/,
  number: /[0-9]/,
  special: /[^a-zA-Z0-9]/
};

export type PasswordHintResult = {
  title: string;
  message: string;
  hintType: "error" | "success";
};

const loadOptions = async () => {
  const { adjacencyGraphs, dictionary: commonDictionary } = await import(
    "@zxcvbn-ts/language-common"
  );
  const { dictionary } = await import("@zxcvbn-ts/language-fr");

  return {
    graphs: adjacencyGraphs,
    dictionary: {
      ...commonDictionary,
      ...dictionary
    }
  };
};

export const getPasswordHint = async (
  password: string
): Promise<PasswordHintResult> => {
  if (password.length < MIN_LENGTH)
    return {
      title: "Trop court",
      hintType: "error",
      message: `Votre mot de passe est trop court (${password.length} caractères), la longueur minimale est de ${MIN_LENGTH} caractères`
    };
  if (!Object.values(CHAR_CLASSES_REGEX).every(regex => regex.test(password))) {
    return {
      title: "Insuffisant",
      hintType: "error",
      message:
        "Votre mot de passe ne contient pas tous les types de caractères requis: une lettre minuscule, une lettre majuscule, un chiffre et un caractère spécial"
    };
  }
  const options = await loadOptions();
  zxcvbnOptions.setOptions(options);
  const { score } = zxcvbn(password);
  return score >= MIN_SCORE
    ? {
        title: "Parfait",
        hintType: "success",
        message: "Votre mot de passe est robuste"
      }
    : {
        title: "Insuffisant",
        hintType: "error",
        message: `Votre mot de passe est trop simple, ajoutez de la diversité dans les caractères. 
          Veuillez suivre les conseils ci-dessus.`
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
  const [hint, setHint] = useState<PasswordHintResult | null>(null);
  useEffect(() => {
    getPasswordHint(password).then(result => {
      setHint(result);
    });
  }, [password]);
  if (!password || !hint) return <span />;
  return (
    <Alert
      title={hint.title}
      description={hint.message}
      severity={hint.hintType}
    />
  );
}

export const PassWordHints = () => (
  <div className="fr-messages-group" aria-live="assertive">
    <p className="fr-mb-1w fr-text--bold">
      <span className="bold">Votre mot de passe doit </span>: <br />
    </p>
    <p className="fr-text--md fr-mb-1w">
      - contenir {MIN_LENGTH} caractères minimum
      <br />
      - contenir une lettre minuscule, une lettre majuscule, un chiffre et un
      caractère spécial
      <br />
      - avoir une complexité suffisante
      <br />
      Nous vous recommandons d'utiliser une phrase de passe (plusieurs mots
      accolés) ou un gestionnaire de mots de passe
    </p>
  </div>
);
