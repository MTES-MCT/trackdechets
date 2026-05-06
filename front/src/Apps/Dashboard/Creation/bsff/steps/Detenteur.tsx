import React from "react";
import { useParams } from "react-router-dom";
import { BsdType } from "@td/codegen-ui";
import { RhfDetenteurList } from "../../../../Forms/Components/DetenteurList/RhfDetenteurList";

const DetenteurBsff = () => {
  const { siret } = useParams<{ siret: string }>();

  return (
    <div className="fr-col-md-10">
      <RhfDetenteurList
        orgId={siret}
        fieldName="ficheInterventions"
        bsdType={BsdType.Bsff}
      />
    </div>
  );
};

export default DetenteurBsff;
