import React from "react";
import { connect, getIn } from "formik";

export default connect(function AppendixInfo(props) {
  const readableId = getIn(props.formik.values, "readableId");

  return (
    <div>
      <h4>Annexe 1</h4>
      <p>
        Vous êtes en train de modifier un bordereau pour un collecteur de petites
        quantités de déchets relevant d’une même rubrique. Ce bordereau
        nécessite donc la présence d'une annexe 1.
      </p>
      <p>
        Cette annexe n'est pas à compléter sur Trackdéchets mais vous avez la
        possibilité ci-dessous d'en imprimer une. Complétez la et{" "}
        <strong>
          gardez la précieusement en la complétant avec les références de ce
          bordereau
        </strong>
        . Même si les données ne sont pas à saisir sur Trackdéchets, il est de
        votre responsabilité de la conserver afin de pouvoir la présenter en cas
        de contrôle.
      </p>
      <div className="notification warning">
        {readableId ? (
          `Vous pouvez reporter le numéro de bordereau de rattachement ${readableId} sur votre annexe 1.`
        ) : (
          <span>
            Le bordereau est créé au format de brouillon, il permet de préparer
            la tournée et de modifier l'annexe 1. Il ne peut être finalisé que
            lorsque la tournée est terminée, afin de faire le reporting des
            annexes 1. <br /> Lorsque la tournée est terminée, complétez ce
            bordereau brouillon par les éléments manquants (poids total,
            contenants, etc) et validez le. Il apparaitra dans les BSD en
            attente de signature, vous pouvez alors récupérer son numéro et le
            reporter sur la ou les annexe(s) 1 originale(s) que vous conserverez
            comme justificatifs.
          </span>
        )}
      </div>
      <p>
        <a
          className="button"
          href="/notice_12571-1.pdf"
          target="_blank"
          rel="noopener noreferrer"
        >
          Imprimer une annexe 1
        </a>
      </p>
    </div>
  );
});
