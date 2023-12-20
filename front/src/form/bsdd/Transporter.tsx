import { useFormikContext } from "formik";
import {
  Transporter as TransporterType,
  WasteDetailsInput
} from "@td/codegen-ui";
import React from "react";
import { formTransportIsPipeline } from "./utils/packagings";
import { TransporterList } from "../../Apps/Forms/Components/TransporterList/TransporterList";
import { useParams } from "react-router-dom";

type Values = {
  transporter: TransporterType;
  wasteDetails: WasteDetailsInput;
};

export default function Transporter() {
  const { values } = useFormikContext<Values>();

  const { siret } = useParams<{ siret: string }>();

  return !formTransportIsPipeline(values) ? (
    <TransporterList fieldName="transporters" orgId={siret} />
  ) : (
    <h4 className="form__section-heading">Transport par pipeline</h4>
  );
}
