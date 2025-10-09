import { BsdaType, BsdType } from "@td/codegen-ui";

import Alert from "@codegouvfr/react-dsfr/Alert";
import React from "react";
import { useFormContext } from "react-hook-form";
import { useParams } from "react-router-dom";
import { RhfTransporterList } from "../../../../Forms/Components/TransporterList/RhfTransporterList";

const TransporterBsda = () => {
  const { siret } = useParams<{ siret: string }>();
  const { watch } = useFormContext();

  const bsdaType = watch("type");
  const isDechetterie = bsdaType === BsdaType.Collection_2710;

  if (isDechetterie) {
    return (
      <Alert
        title=""
        description="Vous effectuez une collecte en déchèterie. Il n'y a pas de transporteur
        à saisir."
        severity="info"
      />
    );
  }

  return (
    <RhfTransporterList
      orgId={siret}
      fieldName="transporters"
      bsdType={BsdType.Bsda}
    />
  );
};

export default TransporterBsda;
