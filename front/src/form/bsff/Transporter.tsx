import React from "react";
import { BsdType } from "@td/codegen-ui";
import { TransporterList } from "../../Apps/Forms/Components/TransporterList/TransporterList";
import { useParams } from "react-router-dom";

export default function Transporter({ disabled }) {
  const { siret } = useParams<{ siret: string }>();

  return (
    <>
      {disabled && (
        <div className="notification notification--error">
          Les champs ci-dessous ont été scellés via signature et ne sont plus
          modifiables.
        </div>
      )}

      <TransporterList
        orgId={siret}
        fieldName="transporters"
        bsdType={BsdType.Bsff}
      />
    </>
  );
}
