import React from "react";
import { connect, getIn } from "formik";

export default connect(function AppendixInfo(props) {
  const readableId = getIn(props.formik.values, "readableId");

  return (
    <div>
      <h4>Annexe 1</h4>
      <p>
        Vous êtes entrain d'éditer un bordereau pour un collecteur de petites
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
        votre responsabilité de la conserver afin de pouvoir la présenter en cad
        de contrôle.
      </p>
      <div className="notification warning">
        {readableId
          ? `Vous pouvez reporter le numéro de bordereau de rattachement ${readableId} sur votre annexe 1.`
          : `Dès que vous aurez enregistré ce bordereau, vous pourrez récupérer le numéro du bordereau automatiquement affecté par Trackdéchets et le reporter sur votre annexe 1.`}
      </div>
      <p>
        <a className="button" href="notice_12571-1.pdf" target="_blank">
          Imprimer une annexe 1
        </a>
      </p>
    </div>
  );
});
