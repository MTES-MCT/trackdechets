import React from "react";
import TdSwitch from "common/components/Switch";
import { isForeignVat } from "generated/constants/companySearchHelpers";
import {
  BsdaTransporterInput,
  BsdasriTransporterInput,
  BsvhuTransporterInput,
} from "generated/graphql/types";

/**
 * Switch for BSDA, BSVHU and BSDASRI
 */
export default function TransporterReceiptEditionSwitch({
  transporter,
  disabled,
  setFieldValue,
}: {
  transporter:
    | BsdaTransporterInput
    | BsdasriTransporterInput
    | BsvhuTransporterInput;
  disabled: boolean;
  setFieldValue: (field: string, value: boolean) => void;
}) {
  return !isForeignVat(transporter?.company?.vatNumber!) ? (
    <>
      <h4 className="form__section-heading">
        Exemption de récépissé de déclaration de transport de déchets
      </h4>
      <div className="form__row">
        <TdSwitch
          checked={!!transporter?.recepisse?.isExempted}
          onChange={checked =>
            setFieldValue("transporter.recepisse.isExempted", checked)
          }
          disabled={disabled}
          label="Le transporteur déclare être exempté de récépissé conformément aux
            dispositions de l'article R.541-50 du code de l'environnement."
        />
      </div>
    </>
  ) : (
    <></>
  );
}
