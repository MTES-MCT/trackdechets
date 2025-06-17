import Alert from "@codegouvfr/react-dsfr/Alert";
import * as React from "react";
import { formatDate } from "../../../../common/datetime";

export type TransporterRecepisseProps = {
  // Département de la déclaration mentionnée à l'article R. 541-50 du code de l'environnement.
  department?: string | null;
  // Numéro de récépissé mentionné à l'article R. 541-51 du code de l'environnement.
  number?: string | null;
  // Limite de validité du récépissé.
  validityLimit?: string | null;
  customClass?: string;
};

export default function TransporterRecepisse(
  recepisse: TransporterRecepisseProps
) {
  return (
    <div
      className={
        recepisse?.customClass
          ? recepisse?.customClass
          : "fr-grid-row fr-mb-2w fr-mt-2w"
      }
    >
      <Alert
        title={"Récépissé de déclaration de transport de déchets"}
        severity={recepisse?.number?.length ? "info" : "error"}
        description={
          recepisse?.number ? (
            <p>
              Numéro : {recepisse?.number}, département :{" "}
              {recepisse?.department}, date limite de validité :{" "}
              {formatDate(recepisse?.validityLimit!)}.
              <br />
              Informations complétées par le transporteur dans son profil
              Trackdéchets.
            </p>
          ) : (
            <p>
              L'entreprise de transport n'a pas complété ces informations dans
              son profil Trackdéchets. Nous ne pouvons pas les afficher. Il lui
              appartient de les compléter.{" "}
              <span className="tw-text-red-500">
                Dans le cas contraire, elle ne pourra pas signer la prise en
                charge des déchets.
              </span>
            </p>
          )
        }
      />
    </div>
  );
}
