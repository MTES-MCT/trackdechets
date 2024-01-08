import { useFormikContext } from "formik";
import React from "react";
import { formTransportIsPipeline } from "./utils/packagings";
import { TransporterList } from "../../Apps/Forms/Components/TransporterList/TransporterList";
import { useParams } from "react-router-dom";
import { FormFormikValues } from "./utils/initial-state";

export default function Transporter() {
  const { values } = useFormikContext<FormFormikValues>();

  const { siret } = useParams<{ siret: string }>();

  return !formTransportIsPipeline(values) ? (
    <TransporterList fieldName="transporters" orgId={siret} />
  ) : (
    <h4 className="form__section-heading">Transport par pipeline</h4>
  );
}
