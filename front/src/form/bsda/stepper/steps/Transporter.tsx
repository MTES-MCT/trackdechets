import { useFormikContext } from "formik";
import { BsdType, Bsda, BsdaType } from "@td/codegen-ui";
import React from "react";
import { TransporterList } from "../../../../Apps/Forms/Components/TransporterList/TransporterList";
import { useParams } from "react-router-dom";

export function Transporter({ disabled }) {
  const { values } = useFormikContext<Bsda>();

  const { siret } = useParams<{ siret: string }>();

  const isDechetterie = values?.type === BsdaType.Collection_2710;

  if (isDechetterie) {
    return (
      <div className="notification">
        Vous effectuez une collecte en déchetterie. Il n'y a pas de transporteur
        à saisir.
      </div>
    );
  }

  return (
    <>
      {disabled && (
        <div className="notification notification--error">
          Les champs grisés ci-dessous ont été scellés via signature et ne sont
          plus modifiables.
        </div>
      )}

      <TransporterList
        orgId={siret}
        fieldName="transporters"
        bsdType={BsdType.Bsda}
      />
    </>
  );
}
