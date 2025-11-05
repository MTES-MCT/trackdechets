import { BsdType } from "@td/codegen-ui";

import React from "react";
import { useParams } from "react-router-dom";
import { RhfTransporterList } from "../../../../Forms/Components/TransporterList/RhfTransporterList";

const TransporterBsvhu = () => {
  const { siret } = useParams<{ siret: string }>();

  return (
    <RhfTransporterList
      orgId={siret}
      fieldName="transporters"
      bsdType={BsdType.Bsvhu}
    />
  );
};

export default TransporterBsvhu;
