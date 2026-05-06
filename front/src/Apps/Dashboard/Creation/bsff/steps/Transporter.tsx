import React from "react";
import { BsdType } from "@td/codegen-ui";
import { useParams } from "react-router-dom";
import { RhfTransporterList } from "../../../../Forms/Components/TransporterList/RhfTransporterList";

const TransporterBsff = () => {
  const { siret } = useParams<{ siret: string }>();

  return (
    <div className="fr-col-md-10">
      <RhfTransporterList
        orgId={siret}
        fieldName="transporters"
        bsdType={BsdType.Bsff}
      />
    </div>
  );
};

export default TransporterBsff;
