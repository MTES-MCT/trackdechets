import { useFormikContext } from "formik";
import React from "react";
import { formTransportIsPipeline } from "./utils/packagings";
import { TransporterList } from "../../Apps/Forms/Components/TransporterList/TransporterList";
import { useParams } from "react-router-dom";
import { FormFormikValues } from "./utils/initial-state";
import { EmitterType } from "@td/codegen-ui";
import { TransporterForm } from "../../Apps/Forms/Components/TransporterForm/TransporterForm";
import TransporterDisplay from "../../Apps/Forms/Components/TransporterDisplay/TransporterDisplay";

export default function Transporter() {
  const { values } = useFormikContext<FormFormikValues>();

  const { siret } = useParams<{ siret: string }>();
  const emitterType = values.emitter?.type;

  if (formTransportIsPipeline(values)) {
    return <h4 className="form__section-heading">Transport par pipeline</h4>;
  } else if (
    emitterType === EmitterType.Appendix1 ||
    emitterType === EmitterType.Appendix1Producer
  ) {
    const transporter = values.transporters?.[0];
    // TRA-13753 - Un seul transporteur est autorisé en cas de bordereau de tournée dédiée
    if (transporter && transporter?.takenOverAt) {
      return <TransporterDisplay transporter={transporter} />;
    }
    return <TransporterForm orgId={siret} fieldName="transporters[0]" />;
  }

  return <TransporterList fieldName="transporters" orgId={siret} />;
}
